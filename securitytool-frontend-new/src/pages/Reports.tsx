import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { getReport, exportReportCsv } from '../api/reportApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { ApplicationResponseDTO } from '../types/application';
import { ReportResponseDTO } from '../types/report';

const APP_REPORTS_STORAGE_KEY = 'appReportsData'; // Key for localStorage
const APP_CSVS_STORAGE_KEY = 'appCsvsData'; // Key for localStorage

const Reports: React.FC = () => {
  const { data: applications, isLoading, isError, error } = useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    select: (fetchedData: any[]) => {
      if (!fetchedData) return [];
      return fetchedData.map(app => ({
        ...app,
        appId: Number((app as any).id),
      }));
    }
  });  
  const [isLoadReportModalOpen, setIsLoadReportModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [scanResultId, setScanResultId] = useState('');
  const [appReports, setAppReports] = useState<Record<number, ReportResponseDTO | null>>(() => {
    const storedReports = localStorage.getItem(APP_REPORTS_STORAGE_KEY);
    return storedReports ? JSON.parse(storedReports) : {};
  });
  const [appCsvs, setAppCsvs] = useState<Record<number, string>>(() => {
    const storedCsvs = localStorage.getItem(APP_CSVS_STORAGE_KEY);
    return storedCsvs ? JSON.parse(storedCsvs) : {};
  });
  const [loading, setLoading] = useState(false); // Used for Load Report and Download CSV actions
  const [pageLevelError, setPageLevelError] = useState<string | null>(null); // For general errors displayed on the page
  const [appErrors, setAppErrors] = useState<Record<number, string | null>>({}); // New state for app-specific errors

  useEffect(() => {
    if (Object.keys(appReports).length > 0 || localStorage.getItem(APP_REPORTS_STORAGE_KEY)) {
      localStorage.setItem(APP_REPORTS_STORAGE_KEY, JSON.stringify(appReports));
    }
  }, [appReports]);

  useEffect(() => {
    if (Object.keys(appCsvs).length > 0 || localStorage.getItem(APP_CSVS_STORAGE_KEY)) {
      localStorage.setItem(APP_CSVS_STORAGE_KEY, JSON.stringify(appCsvs));
    }
  }, [appCsvs]);

  const handleOpenLoadReportModal = (appId: number) => {
    setSelectedAppId(appId);
    setScanResultId('');
    setPageLevelError(null); // Clear general page errors
    setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear specific app error for this app
    setIsLoadReportModalOpen(true);
  };

  const handleLoadReportSubmit = async () => {
    const idNum = Number(scanResultId);

    if (!selectedAppId) {
      setPageLevelError("An internal error occurred: No application selected."); // Use pageLevelError for this
      setIsLoadReportModalOpen(false);
      return;
    }

    // Clear previous specific error for this app before attempting to load
    setAppErrors(prev => ({ ...prev, [selectedAppId!]: null }));
    setPageLevelError(null); // Clear general errors too

    if (!(idNum > 0)) {
      alert('Please enter a valid Scan Result ID.'); // Keep alert for direct modal input validation
      return;
    }

    setIsLoadReportModalOpen(false); // Close modal immediately
    setLoading(true);

    try {
      const data = await getReport(idNum);
      console.log('Report API Response:', data); // Add logging to debug API response
      let errorForThisApp: string | null = null;

      if (!data || data.applicationId === undefined) {
        errorForThisApp = `Report for Scan ID ${idNum} not found or has incomplete data. Please check the API response.`;
        console.warn('Invalid report data received:', data);
      } else if (data.applicationId !== selectedAppId) {
        errorForThisApp = `Report ID ${idNum} (belongs to Application ${data.applicationId}) cannot be loaded for Application ${selectedAppId}.`;
      }

      if (errorForThisApp) {
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: errorForThisApp }));
        setAppReports(prev => ({ ...prev, [selectedAppId!]: null }));
      } else if (data) { 
        console.log('Successfully loaded report for app ID:', selectedAppId, 'with result ID:', idNum);
        setAppReports(prev => ({ ...prev, [selectedAppId!]: data }));
      } else {
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: `Could not retrieve data for Scan Result ID ${idNum}.` }));
      }

    } catch (e: any) {
      console.error('Error loading report:', e);
      if (selectedAppId) {
        const errorMessage = e.response ? 
          `Failed to load report: ${e.message}. Status: ${e.response.status} - ${e.response.statusText}` : 
          `Failed to load report: ${e.message}`;
        
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: errorMessage }));
        setAppReports(prev => ({ ...prev, [selectedAppId!]: null }));
      } else {
        setPageLevelError(`Failed to load report: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async (appId: number) => {
    const report = appReports[appId];
    if (!report) return;

    // Clear previous errors for this app before attempting download
    setAppErrors(prev => ({ ...prev, [appId]: null }));
    setPageLevelError(null); // Clear general errors
    setLoading(true);

    try {
      const data = await exportReportCsv(report.resultId);
      setAppCsvs(prev => ({ ...prev, [appId]: data }));
      // App error already cleared for this appId
    } catch (e: any) {
      setAppErrors(prev => ({ ...prev, [appId]: `Failed to download CSV: ${e.message}` }));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <Loading />; // This is for initial application list loading
  if (isError) return <ErrorDisplay message={(error as Error).message} />;

  return (
      <div>
        <h1 className="text-2xl mb-4">Reports</h1>
        <ul className="space-y-4">
          {applications?.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null;
            }
            const currentReport = appReports[app.appId];
            const currentCsv = appCsvs[app.appId];
            const currentError = appErrors[app.appId]; // Get app-specific error

            return (
              <li key={app.appId} className="p-4 bg-white rounded shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div>App Name: <span className="font-bold text-lg">{app.appName}</span></div>
                    <div className="text-gray-600">
                      App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                    </div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleOpenLoadReportModal(app.appId)}
                      className="px-4 py-2 bg-teal-600 text-white rounded"
                    >
                      Load Report
                    </button>
                    <button
                      onClick={() => downloadCsv(app.appId)}
                      className="px-4 py-2 bg-teal-800 text-white rounded"
                      disabled={!currentReport || loading} // loading here refers to CSV download or report load
                    >
                      Download CSV
                    </button>
                  </div>
                </div>

                {/* Display App-Specific Error */} 
                {currentError && (
                  <div className="mt-2">
                    <ErrorDisplay message={currentError} />
                  </div>
                )}

                {/* Display Report Details for this app */}
                {currentReport && (
                  <div className="mt-4 p-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold">Report Details for {app.appName}</h3>
                    <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded mt-2">
                      {JSON.stringify(currentReport, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Display CSV content for this app */}
                {currentCsv && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">CSV Data for {app.appName}</h3>
                    <textarea
                      readOnly
                      rows={10}
                      className="w-full mt-2 p-2 bg-gray-100 border rounded"
                      value={currentCsv}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Page-level loading and error display for general/non-app-specific issues */}
        {loading && <div className="mt-4"><Loading /></div>} {/* This loading is for report/CSV actions */}
        {pageLevelError && ( // This will now only show non-app-specific errors
          <div className="mt-4">
            <ErrorDisplay message={pageLevelError} />
          </div>
        )}

        <Modal
          isOpen={isLoadReportModalOpen}
          onClose={() => setIsLoadReportModalOpen(false)}
          onConfirm={handleLoadReportSubmit}
          title="Load Report"
        >
          {/* Modal content is now cleaner, no specific error/loading for submission here */}
          <div className="mb-2">
            <label htmlFor="scanResultId" className="block text-sm font-medium text-gray-700">Scan Result ID</label>
            <input
              type="number"
              id="scanResultId"
              value={scanResultId}
              onChange={(e) => setScanResultId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </Modal>
      </div>
  );
};

export default Reports;
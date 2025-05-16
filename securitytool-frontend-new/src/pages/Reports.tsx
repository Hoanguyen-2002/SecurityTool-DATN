import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { getReport } from '../api/reportApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { ApplicationResponseDTO } from '../types/application';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';

const APP_REPORTS_STORAGE_KEY = 'appReportsData'; // Key for localStorage

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
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
  const [loading, setLoading] = useState(false); // Used for Load Report and Download CSV actions
  const [pageLevelError, setPageLevelError] = useState<string | null>(null); // For general errors displayed on the page
  const [appErrors, setAppErrors] = useState<Record<number, string | null>>({}); // New state for app-specific errors

  const [isIssuesModalOpen, setIsIssuesModalOpen] = useState(false);
  const [issuesModalContent, setIssuesModalContent] = useState<{
    title: string;
    issues: SecurityIssueResponseDTO[] | null;
    isLoading: boolean;
    error: string | null;
    appName: string;
    scanId: string | number;
  } | null>(null);

  useEffect(() => {
    if (Object.keys(appReports).length > 0 || localStorage.getItem(APP_REPORTS_STORAGE_KEY)) {
      localStorage.setItem(APP_REPORTS_STORAGE_KEY, JSON.stringify(appReports));
    }
  }, [appReports]);

  const handleOpenLoadReportModal = (appId: number) => {
    setSelectedAppId(appId);
    setScanResultId(''); // Clear previous scanResultId input
    setPageLevelError(null); // Clear general page errors
    setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear specific app error for this app
    setIsLoadReportModalOpen(true);
  };

  const handleLoadReportSubmit = async () => {
    const idNum = Number(scanResultId);

    if (!selectedAppId) {
      setPageLevelError("An internal error occurred: No application selected.");
      setIsLoadReportModalOpen(false);
      return;
    }

    setAppErrors(prev => ({ ...prev, [selectedAppId!]: null }));
    setPageLevelError(null);

    if (!(idNum > 0)) {
      alert('Please enter a valid Scan Result ID.');
      return;
    }

    setIsLoadReportModalOpen(false);
    setLoading(true);
    // Reset issues modal content before loading new report
    setIssuesModalContent(null); 
    setIsIssuesModalOpen(false);

    const app = applications?.find(a => a.appId === selectedAppId);
    const appName = app ? app.appName : 'Selected Application';

    // Set initial loading state for the issues modal
    setIssuesModalContent({
        title: `Loading Report for ${appName} (Scan ID: ${idNum})...`,
        issues: null,
        isLoading: true,
        error: null,
        appName: appName,
        scanId: idNum
    });
    setIsIssuesModalOpen(true); // Open modal to show loading state

    try {
      const data = await getReport(idNum);
      console.log('Report API Response:', data);
      let errorForThisApp: string | null = null;

      if (!data || data.applicationId === undefined) {
        errorForThisApp = `Report for Scan ID ${idNum} not found or has incomplete data.`;
        console.warn('Invalid report data received:', data);
      } else if (data.applicationId !== selectedAppId) {
        errorForThisApp = `Report ID ${idNum} (belongs to Application ${data.applicationId}) cannot be loaded for Application ${selectedAppId}.`;
      }

      if (errorForThisApp) {
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: errorForThisApp }));
        setAppReports(prev => ({ ...prev, [selectedAppId!]: null }));
        setIssuesModalContent({
          title: `Error Loading Report for ${appName}`,
          issues: null,
          isLoading: false,
          error: errorForThisApp,
          appName: appName,
          scanId: idNum
        });
      } else if (data) { 
        console.log('Successfully loaded report for app ID:', selectedAppId, 'with result ID:', idNum);
        setAppReports(prev => ({ ...prev, [selectedAppId!]: data }));
        setIssuesModalContent({
          title: `Security Issues for ${appName} (Scan ID: ${idNum})`,
          issues: data.issues || [],
          isLoading: false,
          error: null,
          appName: appName,
          scanId: idNum
        });
        // Invalidate dashboardStats to refresh dashboard if needed
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      } else {
        const unknownError = `Could not retrieve data for Scan Result ID ${idNum}.`;
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: unknownError }));
        setIssuesModalContent({
          title: `Error Loading Report for ${appName}`,
          issues: null,
          isLoading: false,
          error: unknownError,
          appName: appName,
          scanId: idNum
        });
      }
    } catch (e: any) {
      console.error('Error loading report:', e);
      const errorMessage = e.response ? 
        `Failed to load report: ${e.message}. Status: ${e.response.status} - ${e.response.statusText}` : 
        `Failed to load report: ${e.message}`;
      
      if (selectedAppId) {
        setAppErrors(prev => ({ ...prev, [selectedAppId!]: errorMessage }));
        setAppReports(prev => ({ ...prev, [selectedAppId!]: null }));
      } else {
        setPageLevelError(errorMessage);
      }
      setIssuesModalContent({
        title: `Error Loading Report for ${appName}`,
        issues: null,
        isLoading: false,
        error: errorMessage,
        appName: appName,
        scanId: idNum
      });
    } finally {
      setLoading(false);
      // Ensure modal is open if content was set, otherwise it might have been closed by setLoading(true) if it was fast
      if (issuesModalContent) { // Check if content was set
         // Update isLoading to false in the modal content if not already handled by error/success cases
         setIssuesModalContent(prev => prev ? {...prev, isLoading: false} : null);
         setIsIssuesModalOpen(true);
      }
    }
  };

  // Helper function to convert issues to CSV string
  const convertIssuesToCsv = (issues: SecurityIssueResponseDTO[]): string => {
    if (!issues || issues.length === 0) return "";

    const header = ["Issue ID", "Issue Type", "Severity", "Description", "Remediation", "Solution", "Status", "Created At", "Endpoint ID"];
    const rows = issues.map(issue => [
      issue.issueId,
      issue.issueType,
      issue.severity,
      `"${issue.description?.replace(/"/g, '\'') || ''}"`,
      `"${issue.remediation?.replace(/"/g, '\'') || ''}"`,
      `"${issue.solution?.replace(/"/g, '\'') || ''}"`,
      issue.status,
      issue.createdAt,
      issue.endpointId || 'N/A'
    ].join(','));

    return [header.join(','), ...rows].join('\r\n');
  };

  const downloadCsv = async (appId: number) => {
    const report = appReports[appId];
    if (!report || !report.issues) {
      setAppErrors(prev => ({ ...prev, [appId]: "No report issues loaded to download CSV from." }));
      return;
    }
    const app = applications?.find(a => a.appId === appId);
    const appName = app ? app.appName : 'report';

    setAppErrors(prev => ({ ...prev, [appId]: null }));
    setPageLevelError(null);
    setLoading(true);

    try {
      // Use the client-side converter with the already fetched report data
      const csvString = convertIssuesToCsv(report.issues);
      if (!csvString) {
        setAppErrors(prev => ({ ...prev, [appId]: "No issues found in the report to export." }));
        setLoading(false);
        return;
      }

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${appName}_scan_${report.resultId}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (e: any) {
      setAppErrors(prev => ({ ...prev, [appId]: `Failed to generate or download CSV: ${e.message}` }));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <Loading />; // This is for initial application list loading
  if (isError) return <ErrorDisplay message={(error as Error).message} />;

  const openIssuesModalForApp = (appId: number) => {
    const report = appReports[appId];
    const app = applications?.find(a => a.appId === appId);
    if (report && app) {
      setIssuesModalContent({
        title: `Security Issues for ${app.appName} (Scan ID: ${report.resultId})`,
        issues: report.issues || [],
        isLoading: false,
        error: null,
        appName: app.appName,
        scanId: report.resultId
      });
      setIsIssuesModalOpen(true);
    } else {
      setAppErrors(prev => ({ ...prev, [appId]: "Report details not available to display. Please load the report first."}));
    }
  };

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
                      Download Solution (.CSV)
                    </button>
                  </div>
                </div>

                {/* Display App-Specific Error */} 
                {currentError && (
                  <div className="mt-2">
                    <ErrorDisplay message={currentError} />
                  </div>
                )}

                {/* Button to view issues if report is loaded */}
                {currentReport && (
                  <div className="mt-2">
                    <button
                      onClick={() => openIssuesModalForApp(app.appId)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View Issues (Scan ID: {currentReport.resultId})
                    </button>
                  </div>
                )}
                
                {/* REMOVED INLINE DISPLAY OF REPORT DETAILS */}
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

        {/* Modal for Displaying Security Issues */}
        {issuesModalContent && (
          <Modal
            isOpen={isIssuesModalOpen}
            onClose={() => {
              setIsIssuesModalOpen(false);
              // Optionally clear content, or let it persist for quicker re-opening if desired.
              // For now, let's clear it to ensure fresh state if re-opened via "Load Report"
              // setIssuesModalContent(null); 
            }}
            title={issuesModalContent.title}
            showConfirmButton={false}
            showCancelButton={true}
            cancelButtonText="Close"
            maxWidthClass="max-w-2xl" // Increased width for this specific modal instance
          >
            {issuesModalContent.isLoading && <Loading />}
            {issuesModalContent.error && <ErrorDisplay message={issuesModalContent.error} />}
            {!issuesModalContent.isLoading && !issuesModalContent.error && (
              issuesModalContent.issues && issuesModalContent.issues.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {issuesModalContent.issues.map((issue) => (
                    <li key={issue.issueId} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <p><strong>Issue ID:</strong> <span className="font-mono text-xs bg-gray-200 px-1 rounded">{issue.issueId}</span></p>
                      <p><strong>Type:</strong> 
                        <span className={`font-medium ml-1 px-2 py-0.5 rounded-full text-xs ${ 
                          issue.issueType?.toLowerCase() === 'sonarqube' ? 'bg-blue-100 text-blue-700' : 
                          issue.issueType?.toLowerCase() === 'zap' ? 'bg-green-100 text-green-700' : 
                          'bg-gray-100 text-gray-700' 
                        }`}>
                          {issue.issueType}
                        </span>
                      </p>
                      <p><strong>Severity:</strong> 
                        <span className={`font-medium ml-1 px-2 py-0.5 rounded-full text-xs ${
                          issue.severity.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' :
                          issue.severity.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          issue.severity.toLowerCase() === 'low' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {issue.severity}
                        </span>
                      </p>
                      <p><strong>Description:</strong> {issue.description}</p>
                      {issue.remediation && <p><strong>Remediation:</strong> {issue.remediation}</p>}
                      <p><strong>Status:</strong> {issue.status}</p>
                      {issue.endpointId && <p className="text-xs text-gray-500">Endpoint ID: {issue.endpointId}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No security issues found in this report.</p>
              )
            )}
          </Modal>
        )}
      </div>
  );
};

export default Reports;
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApplications, searchApplications } from '../api/applicationApi';
import { getReport } from '../api/reportApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';

const APP_REPORTS_STORAGE_KEY = 'appReportsData'; // Key for localStorage

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: applications, isLoading: isLoadingApps, isError: isErrorApps, error: errorApps } = useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
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

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ApplicationResponseDTO[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    if (Object.keys(appReports).length > 0 || localStorage.getItem(APP_REPORTS_STORAGE_KEY)) {
      localStorage.setItem(APP_REPORTS_STORAGE_KEY, JSON.stringify(appReports));
    }
  }, [appReports]);

  const openDetailedReportView = (appId: number, resultId: string | number) => {
    const app = applications?.find(a => a.appId === appId);
    const report = appReports[appId];
    const appName = app ? app.appName : 'Selected Application';

    if (report && report.resultId === resultId) {
      setIssuesModalContent({
        title: `Security Issues for ${appName} (Scan ID: ${resultId})`,
        issues: report.issues || [],
        isLoading: false,
        error: null,
        appName: appName,
        scanId: resultId
      });
      setIsIssuesModalOpen(true);
    } else {
      // This case should ideally not happen if the button is only shown when a report is loaded
      setAppErrors(prev => ({ ...prev, [appId]: `Report for Scan ID ${resultId} is not loaded or does not match.` }));
      // Optionally, trigger a load for this specific report if desired, or show an error.
      // For now, just log and set an error.
      console.error(`Report for Scan ID ${resultId} not found or mismatch for app ${appName}`);
    }
  };

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

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      if (!searchTerm.trim()) {
        setSearchResults(null);
        setSearching(false);
        return;
      }
      const results = await searchApplications(searchTerm.trim());
      setSearchResults(results.map(app => ({ ...app, appId: Number((app as any).id) })));
    } catch (err: any) {
      setSearchError(err.message || 'Search failed.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  if (isLoadingApps) return <Loading />; // This is for initial application list loading
  if (isErrorApps && !applications) return <ErrorDisplay message={errorApps?.message || 'Failed to fetch applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mr-4">Security Reports</h1>
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex rounded-full shadow-sm bg-white border border-gray-300">
            <span className="flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
            </span>
            <input
              type="text"
              className="pl-2 pr-2 py-2 border-0 rounded-full focus:outline-none focus:border-gray-300 w-56 bg-transparent"
              placeholder="Search by Application name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-full font-semibold flex items-center transition-colors hover:bg-blue-600 focus:outline-none border-0 shadow-none"
              disabled={searching}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
              Search
            </button>
          </div>
          {searchTerm && (
            <button
              type="button"
              className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-full border border-gray-200 bg-gray-100"
              onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchError(null); }}
            >
              Clear
            </button>
          )}
        </form>
      </div>
      {searchError && <div className="mb-2"><ErrorDisplay message={searchError} /></div>}

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {(searchResults !== null ? searchResults : applications)!.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null;
            }
            const appSpecificError = appErrors[app.appId];
            const currentReport = appReports[app.appId];
            // Only show if report exists, has a valid resultId, and there is no error indicating not found/deleted
            if (!currentReport || currentReport.resultId === undefined || currentReport.resultId === null) {
              return null;
            }
            if (appSpecificError && /not found|incomplete|deleted|cannot be loaded/i.test(appSpecificError)) {
              return null;
            }
            return (
              <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                <div className="p-6 flex justify-between items-center"> {/* Changed items-start to items-center */}
                  <div className="flex-grow mr-4"> {/* Added flex-grow and margin-right for app details */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={app.appName}>{app.appName}</h2>
                    <p className="text-sm text-gray-500 mb-3 truncate">
                      URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a>
                    </p>

                    {appSpecificError && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
                        <p>Error: {appSpecificError}</p>
                      </div>
                    )}
                  </div>

                  {/* MODIFIED for horizontal buttons on the right, smaller buttons */}
                  <div className="flex-shrink-0 flex flex-row space-x-2 items-center">
                    <button 
                      onClick={() => handleOpenLoadReportModal(app.appId)} 
                      className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap" // Changed text-xs to text-sm
                      title="Load Report by Scan ID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      Load Report
                    </button>
                    {currentReport && currentReport.issues && currentReport.issues.length > 0 && (
                       <button 
                        onClick={() => openDetailedReportView(app.appId, currentReport.resultId)} 
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap"
                        title={`View Loaded Report (ID: ${currentReport.resultId})`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"> {/* Adjusted icon size to h-4 w-4 */}
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View Report (ID: {currentReport.resultId})
                      </button>
                    )}
                    {currentReport && currentReport.issues && currentReport.issues.length > 0 && (
                        <button 
                            onClick={() => downloadCsv(app.appId)} 
                            disabled={loading && selectedAppId === app.appId}
                            className={`px-3 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap 
                                        ${loading && selectedAppId === app.appId ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`} // Changed text-xs to text-sm
                            title="Download Issues as CSV"
                        >
                        {loading && selectedAppId === app.appId ? (
                          <><svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Downloading...</>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download CSV (ID: {currentReport.resultId})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No applications found. Please add an application first via Application Management.</p>
      )}

      {/* Load Report Modal */}
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
          maxWidthClass="max-w-2xl"
        >
          {issuesModalContent.isLoading && <Loading />}
          {issuesModalContent.error && <ErrorDisplay message={issuesModalContent.error} />}
          {!issuesModalContent.isLoading && !issuesModalContent.error && (
            issuesModalContent.issues && issuesModalContent.issues.length > 0 ? (
              <>
                {/* Severity Filter */}
                <div className="mb-4 flex items-center space-x-2">
                  <label htmlFor="severityFilter" className="text-sm font-medium text-gray-700">Filter by Severity:</label>
                  <select
                    id="severityFilter"
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Informational">Informational</option>
                  </select>
                </div>
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {(() => {
                    const filtered = issuesModalContent.issues.filter(issue => !severityFilter || (issue.severity && issue.severity.toLowerCase() === severityFilter.toLowerCase()));
                    if (filtered.length === 0) {
                      return <li className="text-gray-500 italic px-2">No issues found for this severity level.</li>;
                    }
                    return filtered.map((issue) => (
                      <li key={issue.issueId} className="bg-gray-50 rounded p-3 border border-gray-200">
                        <div className="mb-1 font-semibold text-gray-800">Issue ID: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{issue.issueId}</span></div>
                        <div className="mb-1"><span className="font-semibold">Type:</span> <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{issue.issueType}</span></div>
                        <div className="mb-1"><span className="font-semibold">Severity:</span> <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${issue.severity === 'Critical' ? 'bg-red-200 text-red-800' : issue.severity === 'High' ? 'bg-orange-200 text-orange-800' : issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : issue.severity === 'Low' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{issue.severity}</span></div>
                        <div className="mb-1"><span className="font-semibold">Description:</span> {issue.description}</div>
                        {/* Only show Reference if not SonarQube */}
                        {issue.issueType === 'Zap' && issue.reference ? (
                          <div className="mb-1">
                            <span className="font-semibold">Reference:</span>
                            <ul className="list-disc list-inside border-l-4 border-blue-200 bg-blue-50 px-3 py-2 mt-1 rounded space-y-1 ml-2">
                              {issue.reference.split(/\s+/).map((ref, idx) =>
                                /^https?:\/\//.test(ref) ? (
                                  <li key={idx}>
                                    <a href={ref} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                                      {ref}
                                    </a>
                                  </li>
                                ) : (
                                  <li key={idx} className="text-gray-700">{ref}</li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : issue.issueType !== 'SonarQube' && (
                          <div className="mb-1"><span className="font-semibold">Reference:</span> {issue.reference || 'N/A'}</div>
                        )}
                        <div className="mb-1"><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${issue.severity === 'Critical' ? 'bg-red-200 text-red-800' : issue.severity === 'High' ? 'bg-orange-200 text-orange-800' : issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : issue.severity === 'Low' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{issue.status}</span></div>
                      </li>
                    ));
                  })()}
                </ul>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No issues found for this report.</p>
            )
          )}
        </Modal>
      )}
    </div>
  );
};

export default Reports;
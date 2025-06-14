import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApplications, searchApplications, PaginatedApplications } from '../api/applicationApi';
import { getReport } from '../api/reportApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';
import { Bar } from 'react-chartjs-2';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const { data: paginatedApps, isLoading: isLoadingApps, isError: isErrorApps, error: errorApps } = useQuery<PaginatedApplications, Error>({
    queryKey: ['applications', page, pageSize],
    queryFn: () => fetchApplications(page, pageSize),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (paginatedApps) {
      setTotalPages(paginatedApps.totalPages);
      setTotalElements(paginatedApps.totalElement);
    }
  }, [paginatedApps]);
  const applications: ApplicationResponseDTO[] = paginatedApps && Array.isArray((paginatedApps as any).content)
    ? (paginatedApps as any).content.map((app: any) => ({ ...app, appId: Number(app.id) }))
    : [];

  const [isLoadReportModalOpen, setIsLoadReportModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [scanResultId, setScanResultId] = useState('');  const [appReports, setAppReports] = useState<Record<number, ReportResponseDTO | null>>({});
  const [loading, setLoading] = useState(false); // Used for Load Report and Download CSV actions
  const [appErrors, setAppErrors] = useState<Record<number, string | null>>({}); // New state for app-specific errors
  const [scanResultIdError, setScanResultIdError] = useState<string | null>(null); // Field-specific error for scan result ID

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

  // Add state for compare modal and selected scan result for comparison
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareScanId, setCompareScanId] = useState('');  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareScanIdError, setCompareScanIdError] = useState<string | null>(null);
  const [compareReport, setCompareReport] = useState<ReportResponseDTO | null>(null);
  const [compareAppId, setCompareAppId] = useState<number | null>(null);

  // Rehydrate appReports from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('appReports');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAppReports(parsed);
      } catch {}
    }
  }, []);

  // Persist appReports to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appReports', JSON.stringify(appReports));
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
  };  const handleOpenLoadReportModal = (appId: number) => {
    setSelectedAppId(appId);
    setScanResultId(''); // Clear previous scanResultId input
    setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear specific app error for this app
    setScanResultIdError(null); // Clear field-specific error when opening modal
    setIsLoadReportModalOpen(true);
  };const handleLoadReportSubmit = async () => {
    const idNum = Number(scanResultId);

    if (!selectedAppId) {
      setAppErrors(prev => ({ ...prev, [selectedAppId!]: 'No application selected.' }));
      return;
    }

    // Clear all errors before validation
    setAppErrors(prev => ({ ...prev, [selectedAppId!]: null }));
    setScanResultIdError(null);

    if (!(idNum > 0)) {
      setScanResultIdError('Invalid scan result ID.');
      return;
    }

    setLoading(true);
    try {
      let data = await getReport(idNum, selectedAppId);
      
      // Store the report since backend validated it belongs to the app
      setAppReports(prev => {
        const updated = { ...prev, [selectedAppId!]: data };
        localStorage.setItem('appReports', JSON.stringify(updated));
        return updated;
      });
      setIsLoadReportModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });    } catch (e: any) {
      let errorMessage = 'Failed to load report';
      
      console.log('API Error Response:', e.response); // Debug log
      
      // Handle specific backend error responses
      if (e.response) {
        console.log('Response data:', e.response.data); // Debug log
        console.log('Response status:', e.response.status); // Debug log
        
        // Extract error message from various possible response formats
        let backendMessage = null;
        
        // Try different paths to extract the error message
        if (e.response.data) {
          backendMessage = e.response.data.message || 
                          e.response.data.error || 
                          e.response.data.data?.message ||
                          e.response.data.data?.error ||
                          (typeof e.response.data === 'string' ? e.response.data : null);
        }
        
        if (backendMessage && typeof backendMessage === 'string') {
          errorMessage = backendMessage;
          console.log('Extracted backend message:', errorMessage); // Debug log
        } else {
          // Fallback error messages based on status code
          switch (e.response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check the scan result ID.';
              break;
            case 403:
              errorMessage = 'Access denied. Scan result does not belong to this application.';
              break;
            case 404:
              errorMessage = 'Scan result not found.';
              break;
            default:
              errorMessage = `Server error: ${e.response.status} - ${e.response.statusText}`;
          }
        }
        
        // Always show error under the input field for API errors
        setScanResultIdError(errorMessage);
        
      } else {
        errorMessage = `Network error: ${e.message}`;
        setScanResultIdError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert issues to CSV string
  const convertIssuesToCsv = (issues: SecurityIssueResponseDTO[]): string => {
    if (!issues || issues.length === 0) return "";

    // Corrected Header: "Remediation" is replaced by "Reference"
    const header = ["Issue ID", "Issue Type", "Severity", "Description", "Reference", "Solution", "Status", "Created At", "Endpoint ID"];
    const rows = issues.map(issue => [
      issue.issueId,
      issue.issueType,
      issue.severity,
      `"${issue.description?.replace(/"/g, '""') || ''}"`,
      `"${issue.reference?.replace(/"/g, '""') || ''}"`, // Data from issue.reference
      `"${issue.solution?.replace(/"/g, '""') || ''}"`,   // Data from issue.solution
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
  // Helper: get scan type from issues
  function getScanType(issues: any[]): string | null {
    if (!issues || issues.length === 0) return null;
    if (issues.some((i: any) => i.issueType === 'SonarQube')) return 'SonarQube';
    if (issues.some((i: any) => i.issueType === 'Zap')) return 'Zap';
    return null;
  }

  // Helper: get severity distribution as array for chart
  function getSeverityArray(severityDistribution: any) {
    const order = ['High', 'Medium', 'Low', 'Informational'];
    return order.map(key => severityDistribution?.[key] || 0);
  }
  // Handle compare submit
  const handleCompareSubmit = async () => {
    setCompareError(null);
    setCompareScanIdError(null);
    
    if (!compareScanId) {
      setCompareScanIdError('Please enter a scan result ID to compare.');
      return;
    }
    const currentReport = appReports[selectedAppId!];
    if (!currentReport) {
      setCompareError('No scan result loaded to compare with.');
      return;
    }    // Validation: Prevent comparing with itself
    if (String(compareScanId).trim() === String(currentReport.resultId).trim()) {
      setCompareScanIdError('Cannot compare a scan result with itself. Please enter a different scan result ID with the same type.');
      return;
    }

    try {
      const data = await getReport(Number(compareScanId), selectedAppId!);
      
      // Basic validation for comparison
      const type1 = getScanType(data.issues);
      const type2 = getScanType(currentReport.issues);
      if (!type1 || !type2 || type1 !== type2) {
        throw new Error('Scan types do not match.');
      }
      if (!data.summary || !data.summary.bySeverity) {
        throw new Error('No severity data in this scan result.');
      }
      
      setCompareReport(data);
      setCompareAppId(selectedAppId);
      setIsCompareModalOpen(false);
    } catch (e: any) {
      let errorMessage = 'Failed to load scan result for comparison';
      
      console.log('Compare API Error Response:', e.response); // Debug log
      
      // Handle specific backend error responses with enhanced error extraction
      if (e.response) {
        console.log('Compare Response data:', e.response.data); // Debug log
        console.log('Compare Response status:', e.response.status); // Debug log
        
        let backendMessage = null;
        
        // Try different paths to extract the error message (same as Load Report)
        if (e.response.data) {
          backendMessage = e.response.data.message || 
                          e.response.data.error || 
                          e.response.data.data?.message ||
                          e.response.data.data?.error ||
                          (typeof e.response.data === 'string' ? e.response.data : null);
        }
        
        if (backendMessage && typeof backendMessage === 'string') {
          errorMessage = backendMessage;
          console.log('Extracted compare backend message:', errorMessage); // Debug log
        } else {
          // Fallback error messages based on status code
          switch (e.response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check the scan result ID.';
              break;
            case 403:
              errorMessage = 'Access denied. Scan result does not belong to this application.';
              break;
            case 404:
              errorMessage = 'Scan result not found.';
              break;
            default:
              errorMessage = `Server error: ${e.response.status} - ${e.response.statusText}`;
          }
        }
        
        // All backend/API errors should show under the input field
        setCompareScanIdError(errorMessage);
      } else {
        // For other errors (network, etc.), also show under the input field
        const finalMessage = e.message || 'Failed to load scan result for comparison';
        setCompareScanIdError(finalMessage);
      }
    }
  };

  if (isLoadingApps) return <Loading />; // This is for initial application list loading
  if (isErrorApps && !applications) return <ErrorDisplay message={errorApps?.message || 'Failed to fetch applications'} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* User Profile Style Header */}
      <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 shadow-xl">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6l-1-1V9a5 5 0 00-10 0v7l-1 1h6zm0 0v1a3 3 0 006 0v-1M9 9h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Security Reports</h1>
                <p className="text-white/80 text-lg">View and analyze security scan results</p>
              </div>
            </div>
            
            {/* Search Form in Header */}
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="flex rounded-full shadow-sm bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="pl-2 pr-2 py-2 border-0 rounded-full focus:outline-none w-56 bg-transparent text-white placeholder-white/60"
                  placeholder="Search by Application name"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white/20 text-white rounded-full font-semibold flex items-center transition-colors hover:bg-white/30 focus:outline-none border-0 shadow-none"
                  disabled={searching}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </button>
              </div>
              {searchTerm && (
                <button
                  type="button"
                  className="ml-2 px-2 py-1 text-xs text-white/70 hover:text-white rounded-full border border-white/20 bg-white/10"
                  onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchError(null); }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-8">
        {searchError && <div className="mb-4"><ErrorDisplay message={searchError} /></div>}
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          {/* Reports content */}
          {applications && applications.length > 0 ? (
            <div className="space-y-4">
              {(searchResults !== null ? searchResults : applications)!.map(app => {
                if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
                  console.warn('Skipping rendering application due to missing or invalid appId:', app);
                  return null;
                }
                const appSpecificError = appErrors[app.appId];
                const currentReport = appReports[app.appId];
                // Only hide if error indicates not found/deleted
                if (appSpecificError && /not found|incomplete|deleted|cannot be loaded/i.test(appSpecificError)) {
                  // Instead of hiding, show the app with an error message
                  return (
                    <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                      <div className="p-6 flex justify-between items-center">
                        <div className="flex-grow mr-4">
                          <h2 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={app.appName}>
                            {app.appName}:&nbsp;
                            <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a>
                          </h2>
                          <div className="text-red-500 text-sm mt-2">{appSpecificError}</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                    <div className="p-6 flex justify-between items-center">
                      <div className="flex-grow mr-4">
                        {/* Combine name and URL */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={app.appName}>
                          {app.appName}:&nbsp;
                          <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a>
                        </h2>
                        {/* Removed separate URL line */}
                        {currentReport && currentReport.resultId !== undefined && currentReport.resultId !== null ? (
                          <div className="flex flex-row gap-4 items-start">
                            {/* Severity Distribution Bar Chart for loaded scan result */}
                            {(() => {
                              const report = appReports[app.appId];
                              if (!report || !report.summary || !report.summary.bySeverity) return null;
                              const scanType = getScanType(report.issues);
                              return (
                                <div className="flex-1 max-w-md bg-gradient-to-br from-blue-50 to-white rounded-lg shadow p-4">
                                  <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                                    Severity Distribution <span className="ml-1 text-blue-400">({scanType || 'Unknown'})</span>
                                    <span className="ml-2 text-[11px] text-blue-500 font-normal">Scan ID: {report.resultId}</span>
                                  </h4>
                                  <Bar
                                    data={{
                                      labels: ['High', 'Medium', 'Low', 'Informational'],
                                      datasets: [
                                        {
                                          label: `Scan ID: ${report.resultId}`,
                                          data: getSeverityArray(report.summary.bySeverity),
                                          backgroundColor: [
                                            'rgba(239,68,68,0.7)', // High - red
                                            'rgba(251,191,36,0.7)', // Medium - yellow
                                            'rgba(34,197,94,0.7)', // Low - green
                                            'rgba(59,130,246,0.4)', // Informational - blue
                                          ],
                                          borderRadius: 0,
                                          borderSkipped: false,
                                          barPercentage: 0.95,
                                          categoryPercentage: 0.85,
                                        },
                                      ],
                                    }}
                                    options={{
                                      responsive: true,
                                      plugins: {
                                        legend: { display: false },
                                        title: { display: false },
                                        tooltip: {
                                          backgroundColor: '#fff',
                                          titleColor: '#1e293b',
                                          bodyColor: '#334155',
                                          borderColor: '#e0e7ef',
                                          borderWidth: 1,
                                          padding: 10,
                                          cornerRadius: 8,
                                          displayColors: false,
                                        },
                                        datalabels: {
                                          display: false,
                                        },
                                      },
                                      indexAxis: 'y',
                                      scales: {
                                        x: {
                                          beginAtZero: true,
                                          ticks: { precision: 0, font: { size: 15 }, color: '#64748b' },
                                          grid: { color: '#e0e7ef' },
                                        },
                                        y: {
                                          grid: { display: false },
                                          ticks: { font: { size: 15 }, color: '#64748b' },
                                        },
                                      },
                                    }}
                                    // @ts-ignore
                                    plugins={['datalabels']}
                                    height={140}
                                  />
                                </div>
                              );
                            })()}
                            {/* Comparison Bar Chart (if compareReport is set and this app is selected) */}
                            {(compareAppId === app.appId && compareReport) && (() => {
                              const report1 = appReports[app.appId];
                              const report2 = compareReport;
                              if (!report1 || !report2) return null;
                              const type1 = getScanType(report1.issues);
                              const type2 = getScanType(report2.issues);
                              if (!type1 || !type2 || type1 !== type2) return null;
                              if (!report1.summary || !report1.summary.bySeverity || !report2.summary || !report2.summary.bySeverity) return null;
                              return (
                                <div className="flex-1 max-w-md bg-gradient-to-br from-green-50 to-white rounded-lg shadow p-4">
                                  <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    <span>Severity Comparison</span>
                                    <span className="ml-2 font-normal text-green-500">({type1})</span>
                                  </h4>
                                  <Bar
                                    data={{
                                      labels: ['High', 'Medium', 'Low', 'Informational'],
                                      datasets: [
                                        {
                                          label: `Scan ID: ${report1.resultId}`,
                                          data: getSeverityArray(report1.summary.bySeverity),
                                          backgroundColor: [
                                            'rgba(239,68,68,0.85)',
                                            'rgba(251,191,36,0.85)',
                                            'rgba(34,197,94,0.85)',
                                            'rgba(59,130,246,0.5)',
                                          ],
                                          borderRadius: 0,
                                          borderSkipped: false,
                                          barPercentage: 0.95,
                                          categoryPercentage: 0.85,
                                        },
                                        {
                                          label: `Scan ID: ${report2.resultId}`,
                                          data: getSeverityArray(report2.summary.bySeverity),
                                          backgroundColor: [
                                            'rgba(239,68,68,0.35)',
                                            'rgba(251,191,36,0.35)',
                                            'rgba(34,197,94,0.35)',
                                            'rgba(59,130,246,0.15)',
                                          ],
                                          borderRadius: 0,
                                          borderSkipped: false,
                                          barPercentage: 0.95,
                                          categoryPercentage: 0.85,
                                        },
                                      ],
                                    }}
                                    options={{
                                      responsive: true,
                                      plugins: {
                                        legend: {
                                          position: 'top',
                                          labels: { font: { size: 13 }, color: '#166534' },
                                        },
                                        title: { display: false },
                                        tooltip: {
                                          backgroundColor: '#fff',
                                          titleColor: '#166534',
                                          bodyColor: '#334155',
                                          borderColor: '#bbf7d0',
                                          borderWidth: 1,
                                          padding: 12,
                                          cornerRadius: 10,
                                          displayColors: true,
                                        },
                                        datalabels: {
                                          display: false,
                                        },
                                      },
                                      indexAxis: 'y',
                                      scales: {
                                        x: {
                                          beginAtZero: true,
                                          ticks: { precision: 0, font: { size: 15 }, color: '#166534' },
                                          grid: { color: '#bbf7d0' },
                                        },
                                        y: {
                                          grid: { display: false },
                                          ticks: { font: { size: 15 }, color: '#166534' },
                                        },
                                      },
                                    }}
                                    // @ts-ignore
                                    plugins={['datalabels']}
                                    height={140}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="flex flex-row gap-4 items-center mt-2">
                            <span className="text-gray-400 italic">No scan result loaded for this application.</span>
                          </div>
                        )}
                        {/* Compare Scan Result Button */}
                        {currentReport && currentReport.issues && (
                          <button
                            type="button"
                            className="mt-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"                        onClick={() => {
                              setSelectedAppId(app.appId);
                              setIsCompareModalOpen(true);
                              setCompareScanId('');
                              setCompareError(null);
                              setCompareScanIdError(null); // Clear field-specific error when opening modal
                              setCompareAppId(app.appId); // Set the appId for which the comparison chart should show
                              // do not clear compareReport here
                            }}
                          >
                            <ArrowsRightLeftIcon className="h-5 w-5" />
                            Compare Scan Result
                          </button>
                        )}
                      </div>
                      {/* MODIFIED for horizontal buttons on the right, smaller buttons */}
                      <div className="flex-shrink-0 flex flex-row space-x-2 items-center">
                        <button 
                          onClick={() => handleOpenLoadReportModal(app.appId)} 
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap"
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 0 0z" clipRule="evenodd" />
                            </svg>
                            View Report (ID: {currentReport.resultId})
                          </button>
                        )}
                        {currentReport && currentReport.issues && currentReport.issues.length > 0 && (
                            <button 
                                onClick={() => downloadCsv(app.appId)} 
                                disabled={loading && selectedAppId === app.appId}
                                className={`px-3 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap 
                                            ${loading && selectedAppId === app.appId ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
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

          {/* Pagination Controls */}
          <div className="flex justify-between items-center my-4">
            <div>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-gray-200 mr-2 disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
              <span className="ml-4 text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total: {totalElements}</span>
            </div>
          </div>
        </div>

        {/* Load Report Modal */}
        <Modal
          isOpen={isLoadReportModalOpen}
          onClose={() => setIsLoadReportModalOpen(false)}
          onConfirm={handleLoadReportSubmit}
          title="Load Report"
          confirmButtonText="Load Report"
          showConfirmButton={true}
          showCancelButton={true}
          cancelButtonText="Cancel"
          isConfirmDisabled={loading}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="scanResultId" className="block text-sm font-medium text-gray-700 mb-2">
                Scan Result ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="scanResultId"
                value={scanResultId}
                onChange={(e) => {
                  setScanResultId(e.target.value);
                  // Clear field-specific error when user starts typing
                  if (scanResultIdError) {
                    setScanResultIdError(null);
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                placeholder="Enter scan result ID..."
                min="1"
              />
              {scanResultIdError && (
                <div className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                  {scanResultIdError}
                </div>
              )}
            </div>
            
            {loading && (
              <div className="flex items-center justify-center p-4">
                <svg className="animate-spin h-5 w-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-gray-600">Loading report...</span>
              </div>
            )}
          </div>
        </Modal>

        {/* Compare Modal */}
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          onConfirm={handleCompareSubmit}
          title="Compare Scan Results"
          confirmButtonText="Compare"
          showConfirmButton={true}
          showCancelButton={true}
          cancelButtonText="Cancel"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="compareScanId" className="block text-sm font-medium text-gray-700 mb-2">
                Scan Result ID to Compare <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="compareScanId"
                value={compareScanId}
                onChange={(e) => {
                  setCompareScanId(e.target.value);
                  // Clear field-specific error when user starts typing
                  if (compareScanIdError) {
                    setCompareScanIdError(null);
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                placeholder="Enter scan result ID to compare..."
                min="1"
              />
              {compareScanIdError && (
                <div className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                  {compareScanIdError}
                </div>
              )}
            </div>
            
            {compareError && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                {compareError}
              </div>
            )}
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
          maxWidthClass="max-w-5xl"
        >
          <div className="h-[720px] w-full flex flex-col">
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
                  <ul className="space-y-3 flex-1 overflow-y-auto">
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
          </div>
        </Modal>
      )}
        </div>
      </div>
  );
};

export default Reports;
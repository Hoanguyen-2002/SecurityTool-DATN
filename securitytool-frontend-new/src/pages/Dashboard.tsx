import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { fetchApplications, searchApplications, PaginatedApplications } from '../api/applicationApi';
import { fetchAppDashboardStats } from '../api/dashboardApi';
import { ApplicationResponseDTO } from '../types/application';
import { AppDashboardStatsDTO } from '../types/dashboard';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

const Dashboard: React.FC = () => {
  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationResponseDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ApplicationResponseDTO[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch paginated applications
  const { data: paginatedApps, isLoading: appsLoading, isError: appsIsError, error: appsError } = 
    useQuery<PaginatedApplications, Error>({
      queryKey: ['applications', page, pageSize],
      queryFn: () => fetchApplications(page, pageSize),
      staleTime: 5000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    });
  useEffect(() => {
    if (paginatedApps) {
      setTotalPages(paginatedApps.totalPages);
      setTotalElements(paginatedApps.totalElement);
    }
  }, [paginatedApps]);
  const apps: ApplicationResponseDTO[] = paginatedApps && Array.isArray((paginatedApps as any).content)
    ? (paginatedApps as any).content.map((app: any) => ({ ...app, appId: Number(app.id) }))
    : [];

  const { 
    data: appStats,
    isLoading: appStatsLoading,
    isError: appStatsIsError,
    error: appStatsError,
  } = useQuery<AppDashboardStatsDTO, Error>({
    queryKey: ['appDashboardStats', selectedApp?.appId],
    queryFn: () => selectedApp ? fetchAppDashboardStats(selectedApp.appId) : Promise.reject('No app selected'),
    enabled: !!selectedApp,
  });

  const openStatsModal = (app: ApplicationResponseDTO) => {
    setSelectedApp(app);
    setIsStatsModalOpen(true);
  };

  const closeStatsModal = () => {
    setIsStatsModalOpen(false);
    setSelectedApp(null);
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      if (!searchTerm.trim()) {
        setSearchResults(null);
        setSearching(false);
        setPage(0); // Reset to first page when clearing search
        return;
      }
      // Always use searchApplications for search
      const results = await searchApplications(searchTerm.trim());
      setSearchResults(results.map(app => ({ ...app, appId: app.appId ?? Number((app as any).id) })));
    } catch (err: any) {
      setSearchError(err.message || 'Search failed.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const prepareChartData = (stats: AppDashboardStatsDTO) => {
    const severityLabels = Object.keys(stats.severityDistribution);
    const severityValues = Object.values(stats.severityDistribution);
    
    const severityBackgroundColors = severityLabels.map(label => {
        switch (label.toLowerCase()) {
            case 'high': return 'rgba(255, 99, 132, 0.6)'; // Red
            case 'medium': return 'rgba(255, 206, 86, 0.6)'; // Yellow
            case 'low': return 'rgba(75, 192, 192, 0.6)'; // Green/Teal
            case 'informational': return 'rgba(59, 130, 246, 0.6)'; // Blue (Tailwind blue-500)
            default: return 'rgba(201, 203, 207, 0.6)'; // Grey for others
        }
    });
    const severityBorderColors = severityBackgroundColors.map(color => color.replace('0.6', '1'));


    const severityData = {
      labels: severityLabels.map(label => label.charAt(0).toUpperCase() + label.slice(1)), // Capitalize labels
      datasets: [
        {
          label: 'Issue Severity',
          data: severityValues,
          backgroundColor: severityBackgroundColors,
          borderColor: severityBorderColors,
          borderWidth: 1,
        },
      ],
    };
    
    return { severityData };
  };


  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={(appsError as any)?.message || 'Failed to load applications'} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-xl">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
                <p className="text-white/80 text-lg">Overview of application security metrics</p>
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
                  onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchError(null); setPage(0); }}
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
          {/* Dashboard content */}
          {(() => {
            // If searching and searchResults is not null, show only searchResults (even if empty)
            if (searchTerm && searchResults !== null) {
              if (searchResults.length === 0) {
                return <p className="text-gray-500">No applications found.</p>;
              }
              return (
                <ul className="space-y-4">
                  {searchResults.map(app => (
                    app && app.appId !== undefined && app.appId !== null && !isNaN(Number(app.appId)) ? (
                      <li key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-medium text-gray-800 mb-1">
                              {app.appName}:&nbsp;
                              <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                {app.appUrl}
                              </a>
                            </h3>
                            <AppStatsInline appId={Number(app.appId)} />
                          </div>
                          <button 
                            onClick={() => openStatsModal(app)} 
                            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors text-sm font-medium flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.001.028-.002.055-.002.082 0 .027.001.054.002.082-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7-.001-.028-.002-.055-.002-.082 0-.027.001.054.002.082z" />
                            </svg>
                            View Issue Statistics
                          </button>
                        </div>
                      </li>
                    ) : null
                  ))}
                </ul>
              );
            }
            // Otherwise, show all apps
            if (apps.length === 0) {
              return <p className="text-gray-500">No applications found.</p>;
            }
            return (
              <ul className="space-y-4">
                {apps.map(app => (
                  app && app.appId !== undefined && app.appId !== null && !isNaN(Number(app.appId)) ? (
                    <li key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-medium text-gray-800 mb-1">
                            {app.appName}:&nbsp;
                            <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                              {app.appUrl}
                            </a>
                          </h3>
                          <AppStatsInline appId={Number(app.appId)} />
                        </div>
                        <button 
                          onClick={() => openStatsModal(app)} 
                          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors text-sm font-medium flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.001.028-.002.055-.002.082 0 .027.001.054.002.082-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7-.001-.028-.002-.055-.002-.082 0-.027.001.054.002.082z" />
                          </svg>
                          View Issue Statistics
                        </button>
                      </div>
                    </li>
                  ) : null
                ))}
              </ul>
            );
          })()}

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
      </div>

      {/* Modal for detailed statistics */}
      {selectedApp && (
        <Modal
          isOpen={isStatsModalOpen}
          onClose={closeStatsModal}
          title={`Detailed Statistics for ${selectedApp.appName}`}
          showConfirmButton={false}
          cancelButtonText="Close"
          maxWidthClass="max-w-2xl"
        >
          {appStatsLoading && <Loading />}
          {appStatsIsError && <ErrorDisplay message={(appStatsError as any)?.message || 'Failed to load statistics for this application'} />}
          {appStats && !appStatsLoading && !appStatsIsError && (
            <div className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-md shadow-sm text-center">
                  <p className="text-sm text-blue-700 font-semibold">SonarQube Scans</p>
                  <p className="text-2xl font-bold text-blue-800">{appStats.staticScanCount}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-md shadow-sm text-center">
                  <p className="text-sm text-green-700 font-semibold">ZAP Scans</p>
                  <p className="text-2xl font-bold text-green-800">{appStats.dynamicScanCount}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-md shadow-sm text-center">
                  <p className="text-sm text-purple-700 font-semibold">Total Severity Issues</p>
                  <p className="text-2xl font-bold text-purple-800">{appStats.totalIssues}</p>
                </div>
              </div>
              {/* More detailed chart and breakdown */}
              {(() => {
                const { severityData } = prepareChartData(appStats);
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-gray-700 text-center">Issue Severity Distribution</h4>
                      {Object.keys(appStats.severityDistribution).length > 0 && appStats.totalIssues > 0 ? (
                        <div className="max-w-xs mx-auto mb-6">
                            <Doughnut 
                              data={severityData} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                animation: {
                                  animateRotate: true,
                                  animateScale: true,
                                  duration: 1200
                                },
                                plugins: {
                                  legend: { position: 'top' as const },
                                  title: { display: false },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context: any) {
                                        let label = context.label || '';
                                        if (label) {
                                          label += ': ';
                                        }
                                        if (context.parsed !== null && typeof context.parsed === 'number') {
                                          const datasetData = context.dataset.data as number[];
                                          const total = datasetData.reduce((acc: number, val: number | null) => acc + (Number(val) || 0), 0);
                                          const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%';
                                          label += (context.raw as number) + ' (' + percentage + ')';
                                        }
                                        return label;
                                      }
                                    }
                                  },
                                  datalabels: {
                                    formatter: (value: number, context: any) => {
                                      const currentValue = Number(value) || 0;
                                      const datasetData = context.chart.data.datasets[0].data as number[];
                                      const total = datasetData.reduce((acc: number, val: number | null) => acc + (Number(val) || 0), 0);
                                      const percentage = total > 0 ? ((currentValue / total) * 100).toFixed(1) + '%' : '0%';
                                      return percentage;
                                    },
                                    color: '#fff',
                                    font: { weight: 'bold' as const }
                                  }
                                }
                              }} 
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No severity data available for chart.</p>
                        )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-gray-700 text-center">Severity Breakdown</h4>
                      {appStats.severityDistribution && Object.keys(appStats.severityDistribution).length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {['High', 'Medium', 'Low', 'Informational'] 
                            .filter(level => appStats.severityDistribution[level] !== undefined && appStats.severityDistribution[level] !== null)
                            .map((severityKey) => (
                              <li key={severityKey} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-semibold capitalize">{severityKey}:</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  severityKey === 'High' ? 'bg-red-200 text-red-800' :
                                  severityKey === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                  severityKey === 'Low' ? 'bg-green-200 text-green-800' :
                                  'bg-blue-200 text-blue-800'
                                }`}>
                                  {appStats.severityDistribution[severityKey]}
                                </span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No severity data available.</p>
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* Removed Other Details section as requested */}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// Helper component to show inline stats below each app
function AppStatsInline({ appId }: { appId: number }) {
  const { data: stats, isLoading, isError } = useQuery<AppDashboardStatsDTO, Error>({
    queryKey: ['appDashboardStats', appId],
    queryFn: () => fetchAppDashboardStats(appId),
  });
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (!stats) return;
    const severityOrder = ['High', 'Medium', 'Low', 'Informational'];
    severityOrder.forEach((sev, idx) => {
      const count = stats.severityDistribution[sev] || 0;
      const bar = barRefs.current[idx];
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '12px';
        setTimeout(() => {
          bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
          // Cap the visual representation at 30 issues for bar width calculation
          const displayCount = Math.min(count, 30);
          bar.style.width = `${displayCount > 0 ? Math.max(12, displayCount * 14) : 12}px`;
        }, 50);
      }
    });
  }, [stats]);
  if (isLoading) return <div className="mt-2 text-xs text-gray-400">Loading stats...</div>;
  if (isError) return <div className="mt-2 text-xs text-red-500">Failed to load stats</div>;
  if (!stats) return null;
  const severityOrder = ['High', 'Medium', 'Low', 'Informational'];
  const colorMap: Record<string, string> = {
    High: 'bg-red-400',
    Medium: 'bg-yellow-400',
    Low: 'bg-green-400',
    Informational: 'bg-blue-300',
  };
  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex gap-4 text-xs text-gray-700 flex-wrap">
        <span className="text-sm flex items-center gap-1">
          <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
            Total Severity Issues:
          </span>
          <span className="font-bold text-purple-800">{stats.totalIssues}</span>
        </span>
      </div>
      <div className="flex flex-col gap-1 mt-2">
        {severityOrder.map((sev, idx) => {
          const count = stats.severityDistribution[sev] || 0;
          const displayCount = count > 30 ? '30+' : count.toString();
          return (
            <div key={sev} className="flex items-center h-6">
              <span className={`w-20 text-sm font-semibold capitalize text-gray-700 mr-6 text-left`}>{sev}:</span>
              <div
                ref={el => { barRefs.current[idx] = el; }}
                className={`rounded ${colorMap[sev] || 'bg-gray-300'}`}
                style={{ height: '14px', width: '12px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }}
                title={`${count}`}
              ></div>
              <span className="ml-4 text-sm text-gray-700 font-semibold">{displayCount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
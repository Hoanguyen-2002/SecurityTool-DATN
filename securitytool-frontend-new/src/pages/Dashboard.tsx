import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAppDashboardStats } from '../api/dashboardApi';
import { fetchApplications, searchApplications } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { AppDashboardStatsDTO } from '../types/dashboard';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the plugin

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels // Register the plugin
);

const Dashboard: React.FC = () => {
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationResponseDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ApplicationResponseDTO[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data: apps, isLoading: appsLoading, isError: appsIsError, error: appsError } = 
    useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
      queryKey: ['applications'], 
      queryFn: fetchApplications,
      select: (fetchedData: any[]) => {
        if (!fetchedData) return [];
        return fetchedData.map(app => ({
          ...app,
          appId: Number(app.id),
        }));
      }
    });

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
        return;
      }
      const results = await searchApplications(searchTerm.trim());
      setSearchResults(results.map(app => ({ ...app, appId: Number(app.appId) })));
    } catch (err: any) {
      setSearchError(err.message || 'Search failed.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const prepareChartData = (stats: AppDashboardStatsDTO) => {
    // scanTypeData is no longer used, so its definition can be removed or commented out.
    /*
    const scanTypeData = {
      labels: ['SonarQube Scans', 'ZAP Scans'],
      datasets: [
        {
          label: 'Number of Scans',
          data: [stats.staticScanCount, stats.dynamicScanCount],
          backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1,
        },
      ],
    };
    */

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
      <div className="p-6 bg-gray-50 min-h-screen"> {/* Added bg-gray-50 and min-h-screen for consistency */}
        <div className="flex items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mr-4">Application Dashboard</h1>
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

        {/* <h2 className="text-xl mb-4 font-medium text-gray-600">Applications</h2> */}
        {(searchResults !== null ? searchResults : apps) && (searchResults !== null ? searchResults : apps)!.length > 0 ? (
          <ul className="space-y-4">
            {(searchResults !== null ? searchResults : apps)!.map(app => (
              <li key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out"> {/* Enhanced card style */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-1">{app.appName}</h3> {/* Updated style */}
                    <p className="text-sm text-gray-500">URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a></p>
                  </div>
                  <button 
                    onClick={() => openStatsModal(app)} 
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors text-sm font-medium flex items-center" // Added rounded-md and flex items-center
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.001.028-.002.055-.002.082 0 .027.001.054.002.082-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7-.001-.028-.002-.055-.002-.082 0-.027.001.054.002.082z" />
                    </svg>
                    View Issue Statistics
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No applications found.</p>
        )}

        {selectedApp && (
          <Modal
            isOpen={isStatsModalOpen}
            onClose={closeStatsModal}
            title={`Statistics for ${selectedApp.appName}`}
            showConfirmButton={false}
            cancelButtonText="Close"
            maxWidthClass="max-w-2xl" // Changed to max-w-2xl for more space for charts
          >
            {appStatsLoading && <Loading />}
            {appStatsIsError && <ErrorDisplay message={(appStatsError as any)?.message || 'Failed to load statistics for this application'} />}
            {appStats && !appStatsLoading && !appStatsIsError && (
              <div className="space-y-6 p-1"> {/* Increased space-y for better separation */}
                
                {/* Original Stats - kept for reference or if charts fail */}
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
                    <p className="text-sm text-purple-700 font-semibold">Total Issues</p>
                    <p className="text-2xl font-bold text-purple-800">{appStats.totalIssues}</p>
                  </div>
                </div>

                {(() => {
                  // const { scanTypeData, severityData } = prepareChartData(appStats); // Old line
                  const { severityData } = prepareChartData(appStats); // Corrected: only severityData is needed
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6"> {/* Changed to single column for Doughnut chart only */}
                      {/* Bar chart section removed
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-700 text-center">Scan Types</h4>
                        {appStats.staticScanCount > 0 || appStats.dynamicScanCount > 0 ? (
                           <Bar 
                             data={scanTypeData} 
                             options={{
                               responsive: true,
                               plugins: { legend: { display: false }, title: { display: false } } 
                             }}
                           />
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No scan data available for chart.</p>
                        )}
                      </div>
                      */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-700 text-center">Issue Severity Distribution</h4>
                        {Object.keys(appStats.severityDistribution).length > 0 && appStats.totalIssues > 0 ? (
                          <div className="max-w-xs mx-auto"> {/* Constrain doughnut chart size */}
                            <Doughnut 
                              data={severityData} 
                              options={{ 
                                responsive: true, 
                                maintainAspectRatio: true,
                                plugins: { 
                                  legend: { position: 'top' as const }, 
                                  title: { display: false },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        let label = context.label || '';
                                        if (label) {
                                          label += ': ';
                                        }
                                        // Ensure context.parsed is a number and data values are numbers for sum
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
                                  datalabels: { // Configuration for chartjs-plugin-datalabels
                                    formatter: (value, context) => {
                                      // Ensure value is a number and data values are numbers for sum
                                      const currentValue = Number(value) || 0;
                                      const datasetData = context.chart.data.datasets[0].data as number[];
                                      const total = datasetData.reduce((acc: number, val: number | null) => acc + (Number(val) || 0), 0);
                                      const percentage = total > 0 ? ((currentValue / total) * 100).toFixed(1) + '%' : '0%';
                                      return percentage;
                                    },
                                    color: '#fff',
                                    font: {
                                      weight: 'bold' as const
                                    },
                                    // backgroundColor: function(context) { // Optional: for label background
                                    //   return context.dataset.backgroundColor;
                                    // },
                                    // borderRadius: 4,
                                    // padding: 6
                                  }
                                } 
                              }} 
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No severity data available for chart.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Detailed Severity List - can be kept or removed based on preference */}
                <div className="p-3 bg-gray-50 rounded-md shadow-sm mt-6">
                  <h4 className="text-md font-semibold mb-2 text-gray-700">Severity Breakdown:</h4>
                  {appStats.severityDistribution && Object.keys(appStats.severityDistribution).length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {['High', 'Medium', 'Low', 'Informational'] 
                        .filter(level => appStats.severityDistribution[level] !== undefined && appStats.severityDistribution[level] !== null)
                        .map((severityKey) => { 
                        const count = appStats.severityDistribution[severityKey]; 
                        let textColor = 'text-gray-600';
                        if (severityKey.toLowerCase() === 'high') textColor = 'text-red-600 font-semibold';
                        else if (severityKey.toLowerCase() === 'medium') textColor = 'text-yellow-600 font-semibold';
                        else if (severityKey.toLowerCase() === 'low') textColor = 'text-green-600';
                        else if (severityKey.toLowerCase() === 'informational') textColor = 'text-blue-500';
                        
                        let bgColor = 'bg-gray-100'; 
                        if (severityKey.toLowerCase() === 'high') bgColor = 'bg-red-50';
                        else if (severityKey.toLowerCase() === 'medium') bgColor = 'bg-yellow-50';
                        else if (severityKey.toLowerCase() === 'low') bgColor = 'bg-green-50';
                        else if (severityKey.toLowerCase() === 'informational') bgColor = 'bg-blue-50';

                        return (
                          <li key={severityKey} className={`flex justify-between items-center p-1.5 rounded ${bgColor}`}>
                            <span className={`capitalize ${textColor}`}>{severityKey.toLowerCase()}</span>
                            <span className={`font-bold ${textColor}`}>{count}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No severity data available.</p>
                  )}
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
  );
};

export default Dashboard;
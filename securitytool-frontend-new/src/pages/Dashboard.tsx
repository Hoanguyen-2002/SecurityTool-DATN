import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAppDashboardStats } from '../api/dashboardApi';
import { fetchApplications } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { AppDashboardStatsDTO } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationResponseDTO | null>(null);

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

  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={(appsError as any)?.message || 'Failed to load applications'} />;

  return (
      <div className="p-6 bg-gray-50 min-h-screen"> {/* Added bg-gray-50 and min-h-screen for consistency */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Application Dashboard</h1> {/* Updated style */}

        {/* <h2 className="text-xl mb-4 font-medium text-gray-600">Applications</h2> */}
        {apps && apps.length > 0 ? (
          <ul className="space-y-4">
            {apps.map(app => (
              <li key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out"> {/* Enhanced card style */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium text-gray-800 mb-1">{app.appName}</h3> {/* Updated style */}
                    <p className="text-sm text-gray-500">URL: {app.appUrl || 'N/A'}</p>
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
            maxWidthClass="max-w-lg"
          >
            {appStatsLoading && <Loading />}
            {appStatsIsError && <ErrorDisplay message={(appStatsError as any)?.message || 'Failed to load statistics for this application'} />}
            {appStats && !appStatsLoading && !appStatsIsError && (
              <div className="space-y-4 p-1">
                <div className="p-3 bg-blue-100 rounded-md shadow-sm">
                  <p className="text-sm text-blue-700">
                    <strong>SonarQube Scans:</strong> 
                    <span className="font-bold text-blue-800 ml-2">{appStats.staticScanCount}</span>
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-md shadow-sm">
                  <p className="text-sm text-green-700">
                    <strong>Zap Scans:</strong> 
                    <span className="font-bold text-green-800 ml-2">{appStats.dynamicScanCount}</span>
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-md shadow-sm">
                  <p className="text-sm text-purple-700">
                    <strong>Total Issues:</strong> 
                    <span className="font-bold text-purple-800 ml-2">{appStats.totalIssues}</span>
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md shadow-sm">
                  <h4 className="text-md font-semibold mb-2 text-gray-700">Severity Distribution:</h4>
                  {appStats.severityDistribution && Object.keys(appStats.severityDistribution).length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {['High', 'Medium', 'Low', 'Informational'] // Use capitalized keys to match API response
                        .filter(level => appStats.severityDistribution[level] !== undefined && appStats.severityDistribution[level] !== null)
                        .map((severityKey) => { // severityKey will be 'High', 'Medium', etc.
                        const count = appStats.severityDistribution[severityKey]; // Access with capitalized key
                        let textColor = 'text-gray-600';
                        // Comparisons for styling use toLowerCase(), which is robust
                        if (severityKey.toLowerCase() === 'high') textColor = 'text-red-600 font-semibold';
                        else if (severityKey.toLowerCase() === 'medium') textColor = 'text-yellow-600 font-semibold';
                        else if (severityKey.toLowerCase() === 'low') textColor = 'text-green-600';
                        else if (severityKey.toLowerCase() === 'informational') textColor = 'text-blue-500';
                        
                        let bgColor = 'bg-gray-100'; // Default background
                        if (severityKey.toLowerCase() === 'high') bgColor = 'bg-red-50';
                        else if (severityKey.toLowerCase() === 'medium') bgColor = 'bg-yellow-50';
                        else if (severityKey.toLowerCase() === 'low') bgColor = 'bg-green-50';
                        else if (severityKey.toLowerCase() === 'informational') bgColor = 'bg-blue-50';

                        return (
                          <li key={severityKey} className={`flex justify-between items-center p-1.5 rounded ${bgColor}`}>
                            {/* Display text is lowercased then capitalized by CSS class */}
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
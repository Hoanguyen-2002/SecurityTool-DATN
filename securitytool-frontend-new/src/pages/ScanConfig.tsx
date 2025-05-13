import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { triggerZapScan, triggerSonarScan, getSonarScansForApplication, getZapScansForApplication } from '../api/scanConfigApi';
import { associateScanWithApp } from '../api/reportApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { ScanResultDisplay, SonarScanResponseDTO as SonarScanResultType } from '../types/scanConfig';

const SCAN_RESULTS_STORAGE_KEY = 'scanResultsData'; // Key for localStorage

const ScanConfig: React.FC = () => {
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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorState, setErrorState] = useState<string | null>(null); // For general page-level errors
  const [appErrors, setAppErrors] = useState<Record<string, string | null>>({}); // For app-specific errors
  const [scanResults, setScanResults] = useState<Record<number, { zap?: ScanResultDisplay, sonar?: SonarScanResultType }>>(() => {
    const storedResults = localStorage.getItem(SCAN_RESULTS_STORAGE_KEY);
    return storedResults ? JSON.parse(storedResults) : {};
  });

  const [allSonarScans, setAllSonarScans] = useState<Record<number, SonarScanResultType[] | null>>({});
  const [loadingAllSonarScans, setLoadingAllSonarScans] = useState<Record<number, boolean>>({});
  const [expandedSonarScans, setExpandedSonarScans] = useState<Record<number, boolean>>({});

  const [allZapScans, setAllZapScans] = useState<Record<number, ScanResultDisplay[] | null>>({});
  const [loadingAllZapScans, setLoadingAllZapScans] = useState<Record<number, boolean>>({});
  const [expandedZapScans, setExpandedZapScans] = useState<Record<number, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScanType, setCurrentScanType] = useState<'sonar' | 'zap' | null>(null);
  const [currentApp, setCurrentApp] = useState<ApplicationResponseDTO | null>(null);
  const [modalInputs, setModalInputs] = useState({ projectKey: '', targetUrl: '' });
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  useEffect(() => {
    if (currentApp) {
      setModalInputs({
        projectKey: currentApp.appName || '',
        targetUrl: currentApp.appUrl || ''
      });
    }
  }, [currentApp]);

  useEffect(() => {
    if (Object.keys(scanResults).length > 0) {
      localStorage.setItem(SCAN_RESULTS_STORAGE_KEY, JSON.stringify(scanResults));
    }
  }, [scanResults]);

  const openModal = (app: ApplicationResponseDTO, scanType: 'sonar' | 'zap') => {
    console.log('Opening modal for app object (post-select transform):', app);

    if (app.appId === undefined || app.appId === null || isNaN(Number(app.appId))) {
      setErrorState(`Cannot configure scan for application "${app.appName}": The Application ID is missing or invalid. Received: ${app.appId}`);
      return;
    }
    setErrorState(null); // Clear general errors
    setAppErrors(prev => ({ ...prev, [app.appId]: null })); // Clear specific error for this app

    setCurrentApp(app);
    setCurrentScanType(scanType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentApp(null);
    setCurrentScanType(null);
    setModalInputs({ projectKey: '', targetUrl: '' });
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setModalInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = async () => {
    if (!currentApp || !currentScanType) return;

    if (currentScanType === 'sonar') {
      await handleSonarScan(currentApp.appId, modalInputs.projectKey);
    } else if (currentScanType === 'zap') {
      await handleZapScan(currentApp.appId, modalInputs.targetUrl);
    }
    closeModal();
  };

  const handleZapScan = async (appId: number, targetUrl: string) => {
    if (appId === null || appId === undefined || isNaN(appId)) {
      const errorMessage = `ZAP Scan: Application ID is missing, invalid, or NaN. Cannot proceed. AppId: ${appId}, TargetURL: ${targetUrl}`;
      console.error(errorMessage, `(appId type: ${typeof appId})`);
      setErrorState(errorMessage); // Use general error state for this case
      const loadingKey = typeof appId === 'number' && !isNaN(appId) ? `zap-${appId}` : 'zap-invalid';
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }
    if (!targetUrl) {
      setAppErrors(prev => ({ ...prev, [appId]: 'Target URL is required for ZAP scan.'}));
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`zap-${appId}`]: true }));
    setErrorState(null); // Clear general errors
    setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear specific app error

    try {
      const result = await triggerZapScan({ appId, targetUrl });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], zap: result },
      }));

      if (result && result.id) {
        associateScanWithApp(result.id, appId); // Call associateScanWithApp
        const latestScanResults = JSON.parse(localStorage.getItem('latestScanResultIds') || '{}');
        latestScanResults[appId] = { ...latestScanResults[appId], zap: result.id }; // Preserve Sonar id
        localStorage.setItem('latestScanResultIds', JSON.stringify(latestScanResults));
      }

      setSuccessModalMessage('ZAP Scan triggered successfully!');
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      setAppErrors(prev => ({ ...prev, [appId]: e.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`zap-${appId}`]: false }));
    }
  };

  const handleSonarScan = async (appId: number, projectKey: string) => {
    if (appId === null || appId === undefined || isNaN(appId)) {
      const errorMessage = `SonarQube Scan: Application ID is missing, invalid, or NaN. Cannot proceed. AppId: ${appId}, ProjectKey: ${projectKey}`;
      console.error(errorMessage, `(appId type: ${typeof appId})`);
      setErrorState(errorMessage); // Use general error state for this case
      const loadingKey = typeof appId === 'number' && !isNaN(appId) ? `sonar-${appId}` : 'sonar-invalid';
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }
    if (!projectKey) {
      setAppErrors(prev => ({ ...prev, [appId]: 'Project Key is required for SonarQube scan.'}));
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: true }));
    setErrorState(null); // Clear general errors
    setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear specific app error

    try {
      const result: SonarScanResultType = await triggerSonarScan({ appId, projectKey });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], sonar: result as ScanResultDisplay },
      }));
      
      if (result && result.id) {
        associateScanWithApp(result.id, appId); // Call associateScanWithApp
        const latestScanResults = JSON.parse(localStorage.getItem('latestScanResultIds') || '{}');
        latestScanResults[appId] = { sonar: result.id, zap: latestScanResults[appId]?.zap }; // Preserve ZAP id
        localStorage.setItem('latestScanResultIds', JSON.stringify(latestScanResults));
      }
      
      setSuccessModalMessage('SonarQube Scan triggered successfully!');
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      setAppErrors(prev => ({ ...prev, [appId]: e.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: false }));
    }
  };

  const toggleDisplayAllSonarScans = async (appId: number) => {
    const isCurrentlyExpanded = expandedSonarScans[appId];
    setExpandedSonarScans(prev => ({ ...prev, [appId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && (!allSonarScans[appId] || appErrors[appId])) {
      setLoadingAllSonarScans(prev => ({ ...prev, [appId]: true }));
      setAppErrors(prev => ({ ...prev, [appId]: null })); // Clear previous specific error for this section

      try {
        const scans = await getSonarScansForApplication(appId);
        setAllSonarScans(prev => ({ ...prev, [appId]: scans && scans.length > 0 ? scans : [] }));
      } catch (e: any) {
        setAppErrors(prev => ({ ...prev, [appId]: `Failed to fetch SonarQube scan history: ${e.message}` }));
        setAllSonarScans(prev => ({ ...prev, [appId]: null })); // Clear data on error
      }
      setLoadingAllSonarScans(prev => ({ ...prev, [appId]: false }));
    }
  };

  const toggleDisplayAllZapScans = async (appId: number) => {
    const isCurrentlyExpanded = expandedZapScans[appId];
    setExpandedZapScans(prev => ({ ...prev, [appId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && (!allZapScans[appId] || appErrors[`zap-history-${appId}`])) {
      setLoadingAllZapScans(prev => ({ ...prev, [appId]: true }));
      setAppErrors(prev => ({ ...prev, [`zap-history-${appId}`]: null })); // Clear previous specific error for this section

      try {
        const scans = await getZapScansForApplication(appId);
        setAllZapScans(prev => ({ ...prev, [appId]: scans && scans.length > 0 ? scans : [] }));
      } catch (e: any) {
        setAppErrors(prev => ({ ...prev, [`zap-history-${appId}`]: `Failed to fetch ZAP scan history: ${e.message}` }));
        setAllZapScans(prev => ({ ...prev, [appId]: null })); // Clear data on error
      }
      setLoadingAllZapScans(prev => ({ ...prev, [appId]: false }));
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as any)?.message} />;

  return (
    <div>
      <h1 className="text-2xl mb-4">Scan Configurations</h1>
      <ul className="space-y-4">
        {applications?.map(app => {
          const currentAppError = appErrors[app.appId]; // General error for this app (e.g. during scan trigger)
          const sonarHistoryError = appErrors[app.appId]; // Error for Sonar history
          const zapHistoryError = appErrors[`zap-history-${app.appId}`]; // Specific error for ZAP history

          const historicalSonarScansForApp = allSonarScans[app.appId];
          const isLoadingHistoricalSonar = loadingAllSonarScans[app.appId];
          const areHistoricalSonarScansExpanded = expandedSonarScans[app.appId];

          const historicalZapScansForApp = allZapScans[app.appId];
          const isLoadingHistoricalZap = loadingAllZapScans[app.appId];
          const areHistoricalZapScansExpanded = expandedZapScans[app.appId];

          return (
            <li key={app.appId} className="p-4 bg-white rounded shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-1">
                  <div>App Name: <span className="font-bold text-lg">{app.appName}</span></div>
                  <div className="text-gray-600 mb-2">
                    App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                  </div>
                  
                  <button 
                    onClick={() => toggleDisplayAllSonarScans(app.appId)}
                    className="mt-3 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded w-full text-left flex justify-between items-center"
                  >
                    <span>
                      {areHistoricalSonarScansExpanded ? 'Hide' : 'Show'} SonarQube Scan History
                    </span>
                    <span>
                      {isLoadingHistoricalSonar ? 'Loading...' : (areHistoricalSonarScansExpanded ? '▲' : '▼')}
                    </span>
                  </button>

                  {areHistoricalSonarScansExpanded && !isLoadingHistoricalSonar && historicalSonarScansForApp && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {historicalSonarScansForApp.length > 0 ? (
                        <ul className="space-y-3 max-h-60 overflow-y-auto text-sm">
                          {historicalSonarScansForApp.map(scan => (
                            <li key={scan.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                              <h4 className="font-semibold text-md text-blue-700 mb-1">Scan ID: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{scan.id}</span></h4>
                              <p><strong>Date:</strong> {new Date(scan.scanDate).toLocaleString()}</p>
                              <p><strong>Type:</strong> {scan.scanType}</p>
                              <p><strong>Status:</strong> <span className={`font-medium ${scan.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{scan.status}</span></p>
                              {scan.qualityGateResult && <p><strong>Quality Gate:</strong> {scan.qualityGateResult}</p>}
                              <p className="mt-1"><strong>Summary:</strong></p>
                              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">{scan.summary}</pre>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No historical SonarQube scans found.</p>
                      )}
                    </div>
                  )}
                   {areHistoricalSonarScansExpanded && !isLoadingHistoricalSonar && historicalSonarScansForApp === null && !sonarHistoryError && (
                     <p className="text-sm text-gray-500 mt-2">No historical SonarQube scans found or unable to load.</p>
                   )}
                   {areHistoricalSonarScansExpanded && sonarHistoryError && (
                     <div className="mt-2">
                       <ErrorDisplay message={sonarHistoryError} />
                     </div>
                   )}

                  <button 
                    onClick={() => toggleDisplayAllZapScans(app.appId)}
                    className="mt-4 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded w-full text-left flex justify-between items-center"
                  >
                    <span>
                      {areHistoricalZapScansExpanded ? 'Hide' : 'Show'} ZAP Scan History
                    </span>
                    <span>
                      {isLoadingHistoricalZap ? 'Loading...' : (areHistoricalZapScansExpanded ? '▲' : '▼')}
                    </span>
                  </button>

                  {areHistoricalZapScansExpanded && !isLoadingHistoricalZap && historicalZapScansForApp && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {historicalZapScansForApp.length > 0 ? (
                        <ul className="space-y-3 max-h-60 overflow-y-auto text-sm">
                          {historicalZapScansForApp.map(scan => (
                            <li key={scan.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                              <h4 className="font-semibold text-md text-green-700 mb-1">Scan ID: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{scan.id}</span></h4>
                              <p><strong>Date:</strong> {new Date(scan.scanDate).toLocaleString()}</p>
                              <p><strong>Type:</strong> {scan.scanType}</p>
                              <p><strong>Status:</strong> <span className={`font-medium ${scan.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{scan.status}</span></p>
                              <p className="mt-1"><strong>Summary:</strong></p>
                              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-32 text-xs">{scan.summary}</pre>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No historical ZAP scans found.</p>
                      )}
                    </div>
                  )}
                  {areHistoricalZapScansExpanded && !isLoadingHistoricalZap && historicalZapScansForApp === null && !zapHistoryError && (
                     <p className="text-sm text-gray-500 mt-2">No historical ZAP scans found or unable to load.</p>
                   )}
                  {areHistoricalZapScansExpanded && zapHistoryError && (
                    <div className="mt-2">
                      <ErrorDisplay message={zapHistoryError} />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex md:flex-row flex-col md:space-x-4 space-y-4 md:space-y-0 md:justify-end items-start md:items-center">
                  <div className="flex flex-col w-full md:w-auto">
                    <button
                      onClick={() => openModal(app, 'sonar')}
                      className="px-4 py-2 bg-blue-600 text-white rounded w-full"
                      disabled={loadingStates[`sonar-${app.appId}`]}
                    >
                      {loadingStates[`sonar-${app.appId}`] ? 'Scanning...' : 'Run SonarQube Scan'}
                    </button>
                  </div>

                  <div className="flex flex-col w-full md:w-auto">
                    <button
                      onClick={() => openModal(app, 'zap')}
                      className="px-4 py-2 bg-green-600 text-white rounded w-full"
                      disabled={loadingStates[`zap-${app.appId}`]}
                    >
                      {loadingStates[`zap-${app.appId}`] ? 'Scanning...' : 'Run ZAP Scan'}
                    </button>
                  </div>
                </div>
                
                {currentAppError && !areHistoricalSonarScansExpanded && !areHistoricalZapScansExpanded && (
                  <div className="mt-2 col-span-1 md:col-span-3">
                    <ErrorDisplay message={currentAppError} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {errorState && (
        <div className="mt-4">
         <ErrorDisplay message={errorState} />
        </div>
      )}

      {currentApp && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`Configure ${currentScanType === 'sonar' ? 'SonarQube' : 'ZAP'} Scan for ${currentApp.appName}`}
          showFooterActions={false}
        >
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="appId" className="block text-sm font-medium text-gray-700">Application ID</label>
              <input
                type="text"
                name="appId"
                id="appId"
                value={currentApp.appId}
                readOnly
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
              />
            </div>

            {currentScanType === 'sonar' && (
              <div className="mb-4">
                <label htmlFor="projectKey" className="block text-sm font-medium text-gray-700">Project Key</label>
                <input
                  type="text"
                  name="projectKey"
                  id="projectKey"
                  value={modalInputs.projectKey}
                  onChange={handleModalInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={`e.g., ${currentApp.appName}`}
                />
              </div>
            )}

            {currentScanType === 'zap' && (
              <div className="mb-4">
                <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700">Target URL</label>
                <input
                  type="text"
                  name="targetUrl"
                  id="targetUrl"
                  value={modalInputs.targetUrl}
                  onChange={handleModalInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={`e.g., ${currentApp.appUrl}`}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={currentScanType === 'sonar' ? !modalInputs.projectKey : !modalInputs.targetUrl}
              >
                Run Scan
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Scan Status"
        showConfirmButton={true}
        confirmButtonText="OK"
        onConfirm={() => setIsSuccessModalOpen(false)}
        showCancelButton={false}
      >
        <div className="p-4">
          <p className="text-center text-lg text-green-600">{successModalMessage}</p>
        </div>
      </Modal>
    </div>
  );
};

export default ScanConfig;
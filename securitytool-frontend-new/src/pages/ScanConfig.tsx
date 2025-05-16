import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorState, setErrorState] = useState<string | null>(null); // For general page-level errors
  const [appErrors, setAppErrors] = useState<Record<string, string | null>>({}); // For app-specific errors
  const [scanResults, setScanResults] = useState<Record<number, { zap?: ScanResultDisplay, sonar?: SonarScanResultType }>>(() => {
    const storedResults = localStorage.getItem(SCAN_RESULTS_STORAGE_KEY);
    return storedResults ? JSON.parse(storedResults) : {};
  });

  const [allSonarScans, setAllSonarScans] = useState<Record<number, SonarScanResultType[] | null>>({});
  const [loadingAllSonarScans, setLoadingAllSonarScans] = useState<Record<number, boolean>>({});

  const [allZapScans, setAllZapScans] = useState<Record<number, ScanResultDisplay[] | null>>({});
  const [loadingAllZapScans, setLoadingAllZapScans] = useState<Record<number, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScanType, setCurrentScanType] = useState<'sonar' | 'zap' | null>(null);
  const [currentApp, setCurrentApp] = useState<ApplicationResponseDTO | null>(null);
  const [modalInputs, setModalInputs] = useState({ projectKey: '', targetUrl: '' });
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyModalContent, setHistoryModalContent] = useState<{
    title: string;
    data: SonarScanResultType[] | ScanResultDisplay[] | null;
    scanType: 'sonar' | 'zap';
    isLoading: boolean;
    error: string | null;
    appId: number;
  } | null>(null);

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
    if (app.appId === undefined || app.appId === null || isNaN(Number(app.appId))) {
      setErrorState(`Cannot configure scan for application "${app.appName}": The Application ID is missing or invalid. Received: ${app.appId}`);
      return;
    }
    setErrorState(null);
    setAppErrors(prev => ({ ...prev, [app.appId]: null }));

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

    const appIdNumber = Number(currentApp.appId);
    if (isNaN(appIdNumber)) {
      setErrorState(`Invalid Application ID: ${currentApp.appId}`);
      closeModal();
      return;
    }

    if (currentScanType === 'sonar') {
      await handleSonarScan(appIdNumber, modalInputs.projectKey);
    } else if (currentScanType === 'zap') {
      await handleZapScan(appIdNumber, modalInputs.targetUrl);
    }
    closeModal();
  };

  const handleZapScan = async (appId: number, targetUrl: string) => {
    if (appId === null || appId === undefined || isNaN(appId)) {
      const errorMessage = `ZAP Scan: Application ID is missing, invalid, or NaN. Cannot proceed. AppId: ${appId}, TargetURL: ${targetUrl}`;
      console.error(errorMessage, `(appId type: ${typeof appId})`);
      setErrorState(errorMessage);
      const loadingKey = typeof appId === 'number' && !isNaN(appId) ? `zap-${appId}` : 'zap-invalid';
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }
    if (!targetUrl) {
      setAppErrors(prev => ({ ...prev, [appId]: 'Target URL is required for ZAP scan.' }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`zap-${appId}`]: true }));
    setErrorState(null);
    setAppErrors(prev => ({ ...prev, [appId]: null }));

    try {
      const result = await triggerZapScan({ appId, targetUrl });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], zap: result },
      }));
      if (result && result.id) {
        associateScanWithApp(result.id, appId);
        const latestScanResults = JSON.parse(localStorage.getItem('latestScanResultIds') || '{}');
        latestScanResults[appId] = { ...latestScanResults[appId], zap: result.id };
        localStorage.setItem('latestScanResultIds', JSON.stringify(latestScanResults));
      }
      // Invalidate relevant queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
      setErrorState(errorMessage);
      const loadingKey = typeof appId === 'number' && !isNaN(appId) ? `sonar-${appId}` : 'sonar-invalid';
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }
    if (!projectKey) {
      setAppErrors(prev => ({ ...prev, [appId]: 'Project Key is required for SonarQube scan.' }));
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: true }));
    setErrorState(null);
    setAppErrors(prev => ({ ...prev, [appId]: null }));

    try {
      const result: SonarScanResultType = await triggerSonarScan({ appId, projectKey });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], sonar: result as ScanResultDisplay },
      }));
      if (result && result.id) {
        associateScanWithApp(result.id, appId);
        const latestScanResults = JSON.parse(localStorage.getItem('latestScanResultIds') || '{}');
        latestScanResults[appId] = { sonar: result.id, zap: latestScanResults[appId]?.zap };
        localStorage.setItem('latestScanResultIds', JSON.stringify(latestScanResults));
      }
      // Invalidate relevant queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSuccessModalMessage('SonarQube Scan triggered successfully!');
      setIsSuccessModalOpen(true);
    } catch (e: any) {
      setAppErrors(prev => ({ ...prev, [appId]: e.message }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: false }));
    }
  };

  const openSonarHistoryModal = async (appId: number, appName: string) => {
    setIsHistoryModalOpen(true);
    const sonarErrorKey = `sonar-history-${appId}`;

    if (allSonarScans[appId] && !appErrors[sonarErrorKey]) {
      setHistoryModalContent({
        title: `SonarQube Scan History for ${appName}`,
        data: allSonarScans[appId],
        scanType: 'sonar',
        isLoading: false,
        error: null,
        appId,
      });
      return;
    }

    setHistoryModalContent({
      title: `Fetching SonarQube Scan History for ${appName}...`,
      data: null,
      scanType: 'sonar',
      isLoading: true,
      error: null,
      appId,
    });
    setLoadingAllSonarScans(prev => ({ ...prev, [appId]: true }));
    setAppErrors(prev => ({ ...prev, [sonarErrorKey]: null }));

    try {
      const scans = await getSonarScansForApplication(appId);
      const validScans = scans && scans.length > 0 ? scans : [];
      setAllSonarScans(prev => ({ ...prev, [appId]: validScans }));
      setHistoryModalContent({
        title: `SonarQube Scan History for ${appName}`,
        data: validScans,
        scanType: 'sonar',
        isLoading: false,
        error: null,
        appId,
      });
    } catch (e: any) {
      const errorMessage = `Failed to fetch SonarQube scan history: ${e.message}`;
      setAppErrors(prev => ({ ...prev, [sonarErrorKey]: errorMessage }));
      setHistoryModalContent({
        title: `SonarQube Scan History for ${appName}`,
        data: null,
        scanType: 'sonar',
        isLoading: false,
        error: errorMessage,
        appId,
      });
      setAllSonarScans(prev => ({ ...prev, [appId]: null }));
    }
    setLoadingAllSonarScans(prev => ({ ...prev, [appId]: false }));
  };

  const openZapHistoryModal = async (appId: number, appName: string) => {
    setIsHistoryModalOpen(true);
    const zapErrorKey = `zap-history-${appId}`;

    if (allZapScans[appId] && !appErrors[zapErrorKey]) {
      setHistoryModalContent({
        title: `ZAP Scan History for ${appName}`,
        data: allZapScans[appId],
        scanType: 'zap',
        isLoading: false,
        error: null,
        appId,
      });
      return;
    }

    setHistoryModalContent({
      title: `Fetching ZAP Scan History for ${appName}...`,
      data: null,
      scanType: 'zap',
      isLoading: true,
      error: null,
      appId,
    });
    setLoadingAllZapScans(prev => ({ ...prev, [appId]: true }));
    setAppErrors(prev => ({ ...prev, [zapErrorKey]: null }));

    try {
      const scans = await getZapScansForApplication(appId);
      const validScans = scans && scans.length > 0 ? scans : [];
      setAllZapScans(prev => ({ ...prev, [appId]: validScans }));
      setHistoryModalContent({
        title: `ZAP Scan History for ${appName}`,
        data: validScans,
        scanType: 'zap',
        isLoading: false,
        error: null,
        appId,
      });
    } catch (e: any) {
      const errorMessage = `Failed to fetch ZAP scan history: ${e.message}`;
      setAppErrors(prev => ({ ...prev, [zapErrorKey]: errorMessage }));
      setHistoryModalContent({
        title: `ZAP Scan History for ${appName}`,
        data: null,
        scanType: 'zap',
        isLoading: false,
        error: errorMessage,
        appId,
      });
      setAllZapScans(prev => ({ ...prev, [appId]: null }));
    }
    setLoadingAllZapScans(prev => ({ ...prev, [appId]: false }));
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as any)?.message} />;

  return (
    <div>
      <h1 className="text-2xl mb-4">Scan Configurations</h1>
      <ul className="space-y-4">
        {applications?.map(app => {
          const appIdNum = Number(app.appId);
          if (isNaN(appIdNum)) {
            console.warn('Skipping app with invalid ID:', app);
            return null;
          }

          const currentAppError = appErrors[appIdNum] || appErrors[app.appId.toString()];
          const sonarHistoryErrorKey = `sonar-history-${appIdNum}`;
          const zapHistoryErrorKey = `zap-history-${appIdNum}`;

          const sonarHistoryFetchError = appErrors[sonarHistoryErrorKey];
          const zapHistoryFetchError = appErrors[zapHistoryErrorKey];

          const isLoadingSonarHistoryButton = loadingAllSonarScans[appIdNum];
          const isLoadingZapHistoryButton = loadingAllZapScans[appIdNum];

          return (
            <li key={appIdNum} className="p-4 bg-white rounded shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                    <h2 className="text-sm">
                      App Name: <span className="font-bold text-lg">{app.appName}</span>
                    </h2>
                  <p className="text-sm text-gray-600 mb-1">App URL: {app.appUrl}</p>
                  <p className="text-sm text-gray-600 mb-3">App ID: {appIdNum}</p>

                  {currentAppError && <ErrorDisplay message={currentAppError} />}
                </div>

                <div className="md:col-span-1 flex flex-col md:flex-row md:items-center md:justify-end md:space-x-2 space-y-2 md:space-y-0">
                  <button
                    onClick={() => openModal(app, 'sonar')}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded w-full md:w-auto disabled:opacity-50"
                    disabled={loadingStates[`sonar-${appIdNum}`] || loadingStates[`zap-${appIdNum}`]}
                  >
                    {loadingStates[`sonar-${appIdNum}`] ? 'Scanning...' : 'Run SonarQube Scan'}
                  </button>
                  <button
                    onClick={() => openModal(app, 'zap')}
                    className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded w-full md:w-auto disabled:opacity-50"
                    disabled={loadingStates[`sonar-${appIdNum}`] || loadingStates[`zap-${appIdNum}`]}
                  >
                    {loadingStates[`zap-${appIdNum}`] ? 'Scanning...' : 'Run ZAP Scan'}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <button
                  onClick={() => openSonarHistoryModal(appIdNum, app.appName)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded w-full sm:w-auto disabled:opacity-50 flex items-center justify-center"
                  disabled={isLoadingSonarHistoryButton}
                >
                  {isLoadingSonarHistoryButton && <LoadingSpinnerIcon />} View SonarQube Scan History
                </button>
                {sonarHistoryFetchError && !historyModalContent?.isLoading && historyModalContent?.appId === appIdNum && historyModalContent?.scanType === 'sonar' && (
                  <p className="text-xs text-red-500 mt-1">Error loading history. Click to retry.</p>
                )}

                <button
                  onClick={() => openZapHistoryModal(appIdNum, app.appName)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded w-full sm:w-auto disabled:opacity-50 flex items-center justify-center"
                  disabled={isLoadingZapHistoryButton}
                >
                  {isLoadingZapHistoryButton && <LoadingSpinnerIcon />} View ZAP Scan History
                </button>
                {zapHistoryFetchError && !historyModalContent?.isLoading && historyModalContent?.appId === appIdNum && historyModalContent?.scanType === 'zap' && (
                  <p className="text-xs text-red-500 mt-1">Error loading history. Click to retry.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {errorState && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p className="font-semibold">An error occurred:</p>
          <p>{errorState}</p>
        </div>
      )}

      {currentApp && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`Configure ${currentScanType === 'sonar' ? 'SonarQube' : 'ZAP'} Scan for ${currentApp.appName}`}
          onConfirm={handleModalSubmit}
          confirmButtonText={`Run ${currentScanType === 'sonar' ? 'SonarQube' : 'ZAP'} Scan`}
          showConfirmButton={true}
          showCancelButton={true}
        >
          <div className="space-y-4">
            {currentScanType === 'sonar' ? (
              <div>
                <label htmlFor="projectKey" className="block text-sm font-medium text-gray-700">Project Key</label>
                <input
                  type="text"
                  name="projectKey"
                  id="projectKey"
                  value={modalInputs.projectKey}
                  onChange={handleModalInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={`e.g., ${currentApp.appName.replace(/\s+/g, '_')}`}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700">Target URL</label>
                <input
                  type="text"
                  name="targetUrl"
                  id="targetUrl"
                  value={modalInputs.targetUrl}
                  onChange={handleModalInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., http://localhost:8080"
                />
              </div>
            )}
            {appErrors[currentApp.appId] && <ErrorDisplay message={appErrors[currentApp.appId]!} />}
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success"
        showConfirmButton={true}
        confirmButtonText="OK"
        onConfirm={() => setIsSuccessModalOpen(false)}
        showCancelButton={false}
      >
        <p>{successModalMessage}</p>
      </Modal>

      {historyModalContent && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
          }}
          title={historyModalContent.title}
          showConfirmButton={false}
          showCancelButton={true}
          cancelButtonText="Close"
        >
          <div className="max-h-96 overflow-y-auto">
            {historyModalContent.isLoading && <Loading />}
            {historyModalContent.error && <ErrorDisplay message={historyModalContent.error} />}
            {!historyModalContent.isLoading && !historyModalContent.error && historyModalContent.data && (
              <ul className="space-y-3">
                {historyModalContent.data.length === 0 && (
                  <li className="text-gray-500">No scan history found.</li>
                )}
                {historyModalContent.data.map((scan: any) => {
                  let dateValue = scan.scanDate; // Changed to always use scan.scanDate
                  let formattedDate = 'N/A';

                  if (dateValue !== null && dateValue !== undefined) {
                    let d: Date | null = null;
                    if (typeof dateValue === 'string' && dateValue.trim() === '') {
                      // If dateValue is an empty string or only whitespace, d remains null,
                      // and formattedDate will stay 'N/A'.
                    } else {
                      // For non-empty strings, numbers, or actual Date objects
                      d = new Date(dateValue);
                    }

                    // Check if d was successfully initialized and is a valid date
                    if (d && !isNaN(d.getTime())) {
                      formattedDate = d.toLocaleString();
                    }
                  }
                  // If dateValue was null or undefined, formattedDate remains 'N/A'.

                  return (
                    <li key={scan.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="font-semibold">Scan ID: <span className="font-normal">{scan.id}</span></p>
                      <p className="font-semibold">Date: <span className="font-normal">{formattedDate}</span></p>
                      <p className="font-semibold">Status: <span className={`font-normal px-2 py-0.5 rounded-full text-xs ml-1 ${scan.status?.toLowerCase() === 'completed' || scan.status?.toLowerCase() === 'success' ? 'bg-green-100 text-green-700' : scan.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{scan.status}</span></p>
                      {scan.summary && (
                        <div className="mt-1">
                          <p className="font-semibold">Summary:</p>
                          <ul className="list-disc list-inside ml-4 text-xs text-gray-700 space-y-0.5">
                            {scan.summary.split(',').map((item: string) => item.trim()).map((s: string) => {
                              const parts = s.split(':');
                              const key = parts[0];
                              const value = parts.slice(1).join(':');
                              return <li key={key}><span className="font-medium">{key}:</span> {value}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

const LoadingSpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default ScanConfig;
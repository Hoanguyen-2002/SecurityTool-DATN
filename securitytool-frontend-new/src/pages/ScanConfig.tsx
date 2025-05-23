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
  // const [loadingAllSonarScans, setLoadingAllSonarScans] = useState<Record<number, boolean>>({});

  const [allZapScans, setAllZapScans] = useState<Record<number, ScanResultDisplay[] | null>>({});
  // const [loadingAllZapScans, setLoadingAllZapScans] = useState<Record<number, boolean>>({});

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
    // setLoadingAllSonarScans(prev => ({ ...prev, [appId]: true }));
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
    // setLoadingAllSonarScans(prev => ({ ...prev, [appId]: false }));
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
    // setLoadingAllZapScans(prev => ({ ...prev, [appId]: true }));
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
    // setLoadingAllZapScans(prev => ({ ...prev, [appId]: false }));
  };

  if (isLoading) return <Loading />;
  if (isError && !applications) return <ErrorDisplay message={error?.message || 'Failed to fetch applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Scan Configuration</h1>
        {/* Optional: A button to refresh all application data or global settings */}
      </div>

      {isError && applications && 
        <div className="mb-4">
          <ErrorDisplay message={error?.message || 'There was an issue fetching applications, but showing cached data.'} />
        </div>
      }
      {errorState && 
        <div className="mb-4">
          <ErrorDisplay message={errorState} />
        </div>
      }

      {applications && applications.length > 0 ? (
        <div className="space-y-4"> 
          {applications.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(Number(app.appId))) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null; // Skip rendering this app if appId is invalid
            }
            const appSpecificError = appErrors[app.appId];
            const isLoadingSonar = loadingStates[`sonar-${app.appId}`];
            const isLoadingZap = loadingStates[`zap-${app.appId}`];

            return (
              <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                <div className="p-6">
                  <div className="flex justify-between items-start"> {/* Changed items-center to items-start for better alignment if details are multi-line */}
                    <div> {/* Wrapper for app details */}
                      <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={app.appName}>{app.appName}</h2>
                      <p className="text-sm text-gray-500 truncate">
                        URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a>
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex flex-col space-y-2 ml-4"> {/* Added ml-4 for spacing */}
                      <button 
                        onClick={() => openModal(app, 'sonar')} 
                        disabled={isLoadingSonar || isLoadingZap}
                        className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center 
                                    ${isLoadingSonar ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {isLoadingSonar ? (
                          <><svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Scanning...</>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l-4 4-4-4M6 16l-4-4 4-4" /></svg>
                            Configure SonarQube Scan
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => openModal(app, 'zap')} 
                        disabled={isLoadingZap || isLoadingSonar}
                        className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center 
                                    ${isLoadingZap ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        {isLoadingZap ? (
                          <><svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Scanning...</>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.246.99-4.659.99-7.132A8 8 0 008 4a8 8 0 00-8 8c0 2.472.345 4.886.99 7.132h14.02z" /></svg>
                            Configure ZAP Scan
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {appSpecificError && (
                    <div className="mt-3 mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                      <p>Error: {appSpecificError}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-4"> {/* Added mt-4 for spacing */}
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Scan History</h3>
                    <div className="flex space-x-2"> {/* Changed to flex space-x-2 for horizontal history buttons */}
                      <button 
                        onClick={() => openSonarHistoryModal(app.appId, app.appName)} 
                        className="px-4 py-2 text-sm text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors font-medium"
                      >
                        View SonarQube History
                      </button>
                      <button 
                        onClick={() => openZapHistoryModal(app.appId, app.appName)} 
                        className="px-4 py-2 text-sm text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 rounded-md transition-colors font-medium"
                      >
                        View ZAP History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No applications found. Please add an application first via Application Management.</p>
      )}

      {/* Modals (Add/Edit Scan Config, Success, History) */}
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
                  let dateValue = scan.scanDate; 
                  let formattedDate = 'N/A';

                  if (dateValue !== null && dateValue !== undefined) {
                    let d: Date | null = null;
                    if (typeof dateValue === 'string' && dateValue.trim() === '') {
                      // d remains null
                    } else {
                      d = new Date(dateValue);
                    }

                    if (d && !isNaN(d.getTime())) {
                      formattedDate = d.toLocaleString();
                    }
                  }

                  return (
                    <li key={scan.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="font-semibold">Scan ID: <span className="font-normal">{scan.id}</span></p>
                      <p className="font-semibold">Date: <span className="font-normal">{formattedDate}</span></p>
                      <p className="font-semibold">Status: <span className={`font-normal px-2 py-0.5 rounded-full text-xs ml-1 ${scan.status?.toLowerCase() === 'completed' || scan.status?.toLowerCase() === 'success' ? 'bg-green-100 text-green-700' : scan.status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{scan.status}</span></p>
                      {scan.summary && (
                        <div className="mt-1">
                          <p className="font-semibold">Summary:</p>
                          {historyModalContent.scanType === 'sonar' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700 mt-1">
                              {scan.summary.split(',').map((item: string, index: number) => {
                                const trimmedItem = item.trim();
                                if (!trimmedItem) return null;
                                const colonIndex = trimmedItem.indexOf(':');
                                let keyPart: string;
                                let valuePart: string;
                                if (colonIndex === -1) {
                                  keyPart = trimmedItem;
                                  valuePart = '';
                                } else {
                                  keyPart = trimmedItem.substring(0, colonIndex);
                                  valuePart = trimmedItem.substring(colonIndex + 1);
                                }
                                const cleanedKey = keyPart.trim().replace(/"/g, '');
                                const cleanedValue = valuePart.trim().replace(/"/g, '').replace(/;/g, '');
                                if ((!cleanedKey && !cleanedValue) || (!cleanedKey && valuePart.trim() === '')) return null;
                                return (
                                  <div key={index} className="flex items-center">
                                    <span className="font-medium text-gray-800 mr-1">{cleanedKey}{cleanedValue ? ':' : ''}</span>
                                    <span className={
                                      cleanedValue.trim().toLowerCase() === 'good' ? 'text-green-700 font-semibold' :
                                      cleanedValue.trim().toLowerCase() === 'bad' ? 'text-red-700 font-semibold' :
                                      'text-gray-700'
                                    }>{cleanedValue}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {scan.summary.split(',').map((item: string, index: number) => {
                                const trimmedItem = item.trim();
                                if (!trimmedItem) return null;
                                // Remove quotes and semicolons
                                const cleaned = trimmedItem.replace(/"/g, '').replace(/;/g, '');
                                return (
                                  <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium shadow-sm">
                                    {cleaned}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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

export default ScanConfig;
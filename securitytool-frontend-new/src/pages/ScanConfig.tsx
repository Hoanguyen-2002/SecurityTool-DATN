import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { triggerZapScan, triggerSonarScan } from '../api/scanConfigApi';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { ApplicationResponseDTO } from '../types/application';
import { ScanResultDisplay, SonarScanResponseDTO as SonarScanResultType } from '../types/scanConfig';

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
  const [errorState, setErrorState] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<Record<number, { zap?: ScanResultDisplay, sonar?: ScanResultDisplay }>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScanType, setCurrentScanType] = useState<'sonar' | 'zap' | null>(null);
  const [currentApp, setCurrentApp] = useState<ApplicationResponseDTO | null>(null);
  const [modalInputs, setModalInputs] = useState({ projectKey: '', targetUrl: '' });

  useEffect(() => {
    if (currentApp) {
      setModalInputs({
        projectKey: currentApp.appName || '',
        targetUrl: currentApp.appUrl || ''
      });
    }
  }, [currentApp]);

  const openModal = (app: ApplicationResponseDTO, scanType: 'sonar' | 'zap') => {
    console.log('Opening modal for app object (post-select transform):', app);

    if (app.appId === undefined || app.appId === null || isNaN(Number(app.appId))) {
      setErrorState(`Cannot configure scan for application "${app.appName}": The Application ID is missing or invalid. Received: ${app.appId}`);
      return;
    }

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
      setErrorState(errorMessage);
      const loadingKey = typeof appId === 'number' && !isNaN(appId) ? `zap-${appId}` : 'zap-invalid';
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }
    if (!targetUrl) {
      setErrorState('Target URL is required for ZAP scan.');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`zap-${appId}`]: true }));
    setErrorState(null);
    try {
      const result = await triggerZapScan({ appId, targetUrl });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], zap: result },
      }));
      alert('ZAP Scan triggered successfully!');
    } catch (e: any) {
      setErrorState(e.message);
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
      setErrorState('Project Key is required for SonarQube scan.');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: true }));
    setErrorState(null);
    try {
      const result: SonarScanResultType = await triggerSonarScan({ appId, projectKey });
      setScanResults(prev => ({
        ...prev,
        [appId]: { ...prev[appId], sonar: result },
      }));
      alert('SonarQube Scan triggered successfully!');
    } catch (e: any) {
      setErrorState(e.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`sonar-${appId}`]: false }));
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Error message={(error as Error).message} />;

  const getScanInfo = (appId: number, type: 'zap' | 'sonar'): ScanResultDisplay | undefined => {
    return scanResults[appId]?.[type];
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Scan Configurations</h1>
      <ul className="space-y-4">
        {applications?.map(app => {
          const zapScanInfo = getScanInfo(app.appId, 'zap');
          const sonarScanInfo = getScanInfo(app.appId, 'sonar') as SonarScanResultType | undefined;
          return (
            <li key={app.appId} className="p-4 bg-white rounded shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-1">
                  <div>App Name: <span className="font-bold text-lg">{app.appName}</span></div>
                  <div className="text-gray-600">
                    App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                  </div>
                </div>

                <div className="md:col-span-2 flex md:flex-row flex-col md:space-x-4 space-y-4 md:space-y-0 md:justify-end">
                  <div className="flex flex-col">
                    <button
                      onClick={() => openModal(app, 'zap')}
                      className="px-4 py-2 bg-green-600 text-white rounded mb-2 w-full md:w-auto"
                      disabled={loadingStates[`zap-${app.appId}`]}
                    >
                      {loadingStates[`zap-${app.appId}`] ? 'Scanning...' : 'Run ZAP Scan'}
                    </button>
                    {zapScanInfo && (
                      <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                        <h3 className="font-semibold text-md text-green-700">Last ZAP Scan:</h3>
                        <p><strong>Date:</strong> {new Date(zapScanInfo.scanDate).toLocaleString()}</p>
                        <p><strong>Type:</strong> {zapScanInfo.scanType}</p>
                        <p><strong>Status:</strong> <span className={`font-medium ${zapScanInfo.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{zapScanInfo.status}</span></p>
                        <p><strong>Summary:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">{zapScanInfo.summary}</pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <button
                      onClick={() => openModal(app, 'sonar')}
                      className="px-4 py-2 bg-blue-600 text-white rounded mb-2 w-full md:w-auto"
                      disabled={loadingStates[`sonar-${app.appId}`]}
                    >
                      {loadingStates[`sonar-${app.appId}`] ? 'Scanning...' : 'Run SonarQube Scan'}
                    </button>
                    {sonarScanInfo && (
                      <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                        <h3 className="font-semibold text-md text-blue-700">Last SonarQube Scan:</h3>
                        <p><strong>Date:</strong> {new Date(sonarScanInfo.scanDate).toLocaleString()}</p>
                        <p><strong>Type:</strong> {sonarScanInfo.scanType}</p>
                        <p><strong>Status:</strong> <span className={`font-medium ${sonarScanInfo.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{sonarScanInfo.status}</span></p>
                        {(sonarScanInfo as SonarScanResultType).qualityGateResult && <p><strong>Quality Gate:</strong> {(sonarScanInfo as SonarScanResultType).qualityGateResult}</p>}
                        <p><strong>Summary:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">{sonarScanInfo.summary}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {errorState && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {errorState}
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
    </div>
  );
};

export default ScanConfig;
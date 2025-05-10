import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { getReport, exportReportCsv } from '../api/reportApi';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { ApplicationResponseDTO } from '../types/application';
import { ReportResponseDTO } from '../types/report';

const Reports: React.FC = () => {
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
  const [report, setReport] = useState<ReportResponseDTO | null>(null);
  const [csv, setCsv] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleOpenLoadReportModal = (appId: number) => {
    setSelectedAppId(appId);
    setScanResultId('');
    setReport(null);
    setCsv('');
    setIsLoadReportModalOpen(true);
  };

  const handleLoadReportSubmit = async () => {
    const idNum = Number(scanResultId);
    if (idNum > 0 && selectedAppId) {
      try {
        setLoading(true);
        setErrorState(null);
        const data = await getReport(idNum);
        setReport(data);
        setIsLoadReportModalOpen(false);
      } catch (e: any) {
        setErrorState(e.message);
        setReport(null);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please enter a valid Scan Result ID.');
    }
  };

  const downloadCsv = async () => {
    if (!report) return;
    try {
      setLoading(true);
      const data = await exportReportCsv(report.resultId);
      setCsv(data);
      setErrorState(null);
    } catch (e: any) {
      setErrorState(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Error message={(error as Error).message} />;

  return (
      <div>
        <h1 className="text-2xl mb-4">Reports</h1>
        <ul className="space-y-4">
          {applications?.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null;
            }
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
                      onClick={downloadCsv}
                      className="px-4 py-2 bg-teal-800 text-white rounded"
                      disabled={!report || loading}
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Modal
          isOpen={isLoadReportModalOpen}
          onClose={() => setIsLoadReportModalOpen(false)}
          onConfirm={handleLoadReportSubmit}
          title="Load Report"
        >
          {loading && <Loading />}
          {!loading && (
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
          )}
        </Modal>

        {report && (
          <div className="p-4 bg-white rounded shadow mt-4">
            <h2 className="text-xl font-bold">Report Details</h2>
            <pre className="whitespace-pre-wrap">{JSON.stringify(report, null, 2)}</pre>
            <button
              onClick={() => downloadCsv()}
              className="px-4 py-2 bg-teal-800 text-white rounded"
              disabled={!report || loading}
            >
              Download CSV
            </button>
          </div>
        )}
        {csv && (
          <textarea readOnly rows={10} className="w-full mt-4 p-2 bg-gray-50 border rounded">{csv}</textarea>
        )}
      </div>
  );
};

export default Reports;
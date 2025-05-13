import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analyzeFlow, analyzeFlowWithEndpoints } from '../api/flowApi';
import { fetchApplications } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
// import Layout from '../components/Layout'; // Layout is likely applied by a parent route
import Modal from '../components/Modal';
import { SecurityIssueResponseDTO } from '../types/report';
import { ApplicationResponseDTO } from '../types/application';

const FlowAnalyzer: React.FC = () => {
  const flowMut = useMutation({ mutationFn: analyzeFlow });
  const flowEpMut = useMutation({ mutationFn: analyzeFlowWithEndpoints });
  const [result, setResult] = useState<SecurityIssueResponseDTO[] | null>(null);

  // Modal state for Analyze Flow
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [flowIdInput, setFlowIdInput] = useState('');
  const [resultIdInput, setResultIdInput] = useState('');

  const { data: apps, isLoading: appsLoading, isError: appsIsError, error: appsError } = 
    useQuery<ApplicationResponseDTO[], Error>({ 
      queryKey: ['applications'], 
      queryFn: fetchApplications 
    });

  const openFlowModal = () => {
    setFlowIdInput(''); // Reset input fields
    setResultIdInput('');
    setIsFlowModalOpen(true);
  };

  const closeFlowModal = () => {
    setIsFlowModalOpen(false);
  };

  const handleFlowSubmit = () => {
    const flowId = Number(flowIdInput);
    const resultId = Number(resultIdInput);

    if (isNaN(flowId) || isNaN(resultId) || flowId <= 0 || resultId <= 0) {
      alert('Invalid Flow ID or Scan Result ID. Please enter positive numbers.');
      return;
    }

    flowMut.mutate({ flowId, resultId }, { 
      onSuccess: (data) => {
        setResult(data);
        alert('Flow analysis completed successfully!');
        closeFlowModal();
      },
      onError: (error) => {
        alert(`Flow analysis failed: ${error.message}`);
      }
    });
  };

  const handleFlowWithEp = (appId: number) => {
    if (!appId) {
        alert('Application ID is missing.');
        return;
    }
    const businessFlowId = Number(prompt('Enter Business Flow ID:'));
    if (isNaN(businessFlowId) || businessFlowId <= 0) {
      alert('Invalid Business Flow ID.');
      return;
    }
    flowEpMut.mutate({ businessFlowId, appId }, { 
      onSuccess: (data) => {
        setResult(data);
        alert('Flow analysis with endpoints completed successfully!');
      },
      onError: (error) => {
        alert(`Flow analysis with endpoints failed: ${error.message}`);
      }
    });
  };

  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={appsError?.message || 'Failed to load applications'} />;

  return (
      <div className="p-6">
        <h1 className="text-2xl mb-4">Flow Analyzer</h1>
        
        {(flowMut.isPending || flowEpMut.isPending) && <Loading />}
        {flowMut.isError && <ErrorDisplay message={flowMut.error?.message} />}
        {flowEpMut.isError && <ErrorDisplay message={flowEpMut.error?.message} />}

        <div className="space-y-6">
          {apps && apps.length > 0 ? (
            apps.map(app => (
              <div key={app.appId} className="p-4 bg-white rounded shadow">
                <h2 className="text-xl font-semibold mb-3">{app.appName}</h2>
                <div className="space-x-2">
                  <button 
                    onClick={() => openFlowModal()} // Changed to open modal
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Analyze Flow
                  </button>
                  <button 
                    onClick={() => handleFlowWithEp(app.appId)} 
                    className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-900"
                  >
                    Analyze With Endpoints
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-white rounded shadow text-center text-gray-600">
              No applications found. Please add an application first.
            </div>
          )}
        </div>

        {/* Modal for Analyze Flow */}
        <Modal isOpen={isFlowModalOpen} onClose={closeFlowModal} title="Analyze Flow">
          <div className="space-y-4">
            <div>
              <label htmlFor="flowId" className="block text-sm font-medium text-gray-700">Flow ID</label>
              <input 
                type="number" 
                id="flowId" 
                value={flowIdInput} 
                onChange={(e) => setFlowIdInput(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter Flow ID"
              />
            </div>
            <div>
              <label htmlFor="resultId" className="block text-sm font-medium text-gray-700">Scan Result ID</label>
              <input 
                type="number" 
                id="resultId" 
                value={resultIdInput} 
                onChange={(e) => setResultIdInput(e.target.value)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter Scan Result ID"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                onClick={closeFlowModal} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleFlowSubmit} 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Analysis
              </button>
            </div>
          </div>
        </Modal>
        
        {result && result.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-bold mb-2">Analysis Results</h2>
            <ul className="space-y-2">
              {result.map(issue => (
                <li key={issue.issueId} className="p-4 bg-gray-50 rounded border">
                  <div className="flex justify-between">
                    <span className="font-bold">ID: {issue.issueId}</span>
                    <span className={`px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div><span className="font-medium">Type:</span> {issue.issueType}</div>
                    <div className="mt-1"><span className="font-medium">Description:</span> {issue.description}</div>
                    {issue.remediation && (
                      <div className="mt-1">
                        <span className="font-medium">Remediation:</span> {issue.remediation}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result && result.length === 0 && (
          <div className="p-4 bg-white rounded shadow">
            <div className="text-center text-gray-600">No issues found</div>
          </div>
        )}
      </div>
  );
};

// Helper function to get severity color
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-600 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-blue-500 text-white';
    case 'info':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-300';
  }
}

export default FlowAnalyzer;
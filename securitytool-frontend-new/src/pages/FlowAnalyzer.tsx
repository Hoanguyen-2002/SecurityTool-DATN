import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { analyzeFlow, analyzeFlowWithEndpoints } from '../api/flowApi';
import Loading from '../components/Loading';
import Error from '../components/Error';
import Layout from '../components/Layout';
import { SecurityIssueResponseDTO } from '../types/report';

const FlowAnalyzer: React.FC = () => {
  const flowMut = useMutation({ mutationFn: analyzeFlow });
  const flowEpMut = useMutation({ mutationFn: analyzeFlowWithEndpoints });
  const [result, setResult] = useState<SecurityIssueResponseDTO[] | null>(null);

  const handleFlow = () => {
    const flowId = Number(prompt('Flow ID'));
    const resultId = Number(prompt('Scan Result ID'));
    if (!flowId || !resultId) return;
    flowMut.mutate({ flowId, resultId }, { onSuccess: setResult });
  };

  const handleFlowWithEp = () => {
    const businessFlowId = Number(prompt('Business Flow ID'));
    const appId = Number(prompt('Application ID'));
    if (!businessFlowId || !appId) return;
    flowEpMut.mutate({ businessFlowId, appId }, { onSuccess: setResult });
  };

  if (flowMut.isPending || flowEpMut.isPending) 
    return <Layout><Loading /></Layout>;
    
  if (flowMut.isError || flowEpMut.isError)
    return <Layout><Error message={flowMut.error?.message || flowEpMut.error?.message} /></Layout>;

  return (
      <div>
        <h1 className="text-2xl mb-4">Flow Analyzer</h1>
        
        <div className="p-4 bg-white rounded shadow mb-4">
          <h2 className="text-lg font-bold mb-2">Analysis Options</h2>
          <div className="space-x-2">
            <button 
              onClick={handleFlow} 
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Analyze Flow
            </button>
            <button 
              onClick={handleFlowWithEp} 
              className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-900"
            >
              Analyze With Endpoints
            </button>
          </div>
        </div>
        
        {result && result.length > 0 && (
          <div className="p-4 bg-white rounded shadow">
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
import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFlow, getFlows, updateFlow, deleteFlow, analyzeBusinessFlow } from '../api/flowApi';
import { fetchApplications } from '../api/applicationApi';
import { ApplicationResponseDTO } from '../types/application';
import { NewFlowPayload, BusinessFlowResponseDTO, AnalyzeFlowApiResponse, FlowAnalysisRequestDTO, StepResult } from '../types/flow'; // Added StepResult, removed AnalyzeFlowData
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';

const FlowAnalyzer: React.FC = () => {
  const queryClient = useQueryClient();

  const addFlowMutation = useMutation<BusinessFlowResponseDTO, Error, NewFlowPayload>({
    mutationFn: createFlow,
    onSuccess: () => {
      setIsAddFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
    },
    onError: (error) => {
      // Consider setting an error state for the modal to display
      alert(`Failed to add flow: ${error.message}`);
    }
  });

  const updateFlowMutation = useMutation<BusinessFlowResponseDTO, Error, BusinessFlowResponseDTO>({
    mutationFn: updateFlow,
    onSuccess: () => {
      // alert('Flow updated successfully!'); // Consider toast
      setIsEditFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
    },
    onError: (error) => {
      alert(`Failed to update flow: ${error.message}`);
    }
  });

  const deleteFlowMutation = useMutation<void, Error, number>({
    mutationFn: deleteFlow,
    onSuccess: () => {
      setIsConfirmDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
    },
    onError: (error) => {
      alert(`Failed to delete flow: ${error.message}`);
    }
  });

  const analyzeFlowMutation = useMutation<AnalyzeFlowApiResponse, Error, FlowAnalysisRequestDTO>({
    mutationFn: analyzeBusinessFlow,
    onSuccess: (data) => {
      setAnalyzeResult(data);
      setIsAnalyzeResultModalOpen(true);
      setAnalyzeLoading(false);
    },
    onError: (error) => {
      setAnalyzeError(error.message || 'Failed to analyze flow.');
      setAnalyzeResult(null);
      setAnalyzeLoading(false);
      setIsAnalyzeResultModalOpen(true); // Open modal to show error
    },
  });

  const [isAddFlowModalOpen, setIsAddFlowModalOpen] = useState(false);
  const [newFlowData, setNewFlowData] = useState<Omit<NewFlowPayload, 'appId' | 'resultId' | 'apiEndpoints'> & { appId: string; resultId: string; apiEndpoints: string[] }>({
    appId: '',
    flowName: '',
    resultId: '', 
    flowDescription: '',
    apiEndpoints: ['']
  });

  const [isViewFlowsModalOpen, setIsViewFlowsModalOpen] = useState(false);
  const [currentAppForModal, setCurrentAppForModal] = useState<ApplicationResponseDTO | null>(null);
  
  const [isEditFlowModalOpen, setIsEditFlowModalOpen] = useState(false);
  const [editingFlowData, setEditingFlowData] = useState<BusinessFlowResponseDTO | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [flowToDeleteId, setFlowToDeleteId] = useState<number | null>(null);

  const [isAnalyzeResultModalOpen, setIsAnalyzeResultModalOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeFlowApiResponse | null>(null); // Updated type
  const [analyzeLoading, setAnalyzeLoading] = useState(false); // Kept for immediate UI feedback
  const [analyzeError, setAnalyzeError] = useState<string | null>(null); // Kept for immediate UI feedback

  const { data: apps, isLoading: appsLoading, isError: appsIsError, error: appsError } = 
    useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({ 
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

  const {
    data: allBusinessFlows,
  } = useQuery<BusinessFlowResponseDTO[], Error>({
    queryKey: ['businessFlows'],
    queryFn: getFlows,
    enabled: !!currentAppForModal, 
  });

  const flowsForModal = useMemo(() => {
    if (!allBusinessFlows || !currentAppForModal) return [];
    return allBusinessFlows.filter(flow => flow.appId === currentAppForModal.appId);
  }, [allBusinessFlows, currentAppForModal]);

  const openAddFlowModal = (app: ApplicationResponseDTO) => {
    setNewFlowData({
      appId: String(app.appId),
      flowName: '',
      resultId: '',
      flowDescription: '',
      apiEndpoints: ['']
    });
    setIsAddFlowModalOpen(true);
  };

  const closeAddFlowModal = () => {
    setIsAddFlowModalOpen(false);
    setNewFlowData({ appId: '', flowName: '', resultId: '', flowDescription: '', apiEndpoints: [''] });
  };

  const handleNewFlowInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewFlowData(prev => ({ ...prev, [name]: value }));
  };

  const handleEndpointChange = (index: number, value: string) => {
    const updatedEndpoints = [...newFlowData.apiEndpoints];
    updatedEndpoints[index] = value;
    setNewFlowData(prev => ({ ...prev, apiEndpoints: updatedEndpoints }));
  };

  const addEndpointField = () => {
    setNewFlowData(prev => ({ ...prev, apiEndpoints: [...prev.apiEndpoints, ''] }));
  };

  const removeEndpointField = (index: number) => {
    const updatedEndpoints = newFlowData.apiEndpoints.filter((_, i) => i !== index);
    setNewFlowData(prev => ({ ...prev, apiEndpoints: updatedEndpoints }));
  };

  const handleAddFlowSubmit = () => {
    if (!newFlowData.appId || !newFlowData.flowName.trim()) {
      alert("Application ID and Flow Name are required.");
      return;
    }
    const resultIdAsNumber = Number(newFlowData.resultId);
    if (isNaN(resultIdAsNumber)) { // Check if resultId is a valid number
        alert("Result ID must be a valid number.");
        return;
    }

    addFlowMutation.mutate({
      ...newFlowData,
      appId: Number(newFlowData.appId),
      resultId: resultIdAsNumber, // Ensure resultId is a number
      apiEndpoints: newFlowData.apiEndpoints.filter(ep => ep.trim() !== '')
    });
  };
  
  const openEditFlowModal = (flow: BusinessFlowResponseDTO) => {
    setEditingFlowData({
        ...flow,
        apiEndpoints: flow.apiEndpoints || [''] 
    });
    setIsEditFlowModalOpen(true);
  };

  const closeEditFlowModal = () => {
    setIsEditFlowModalOpen(false);
    setEditingFlowData(null);
  };

  const handleEditFlowInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingFlowData) return;
    const { name, value } = e.target;
    setEditingFlowData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditEndpointChange = (index: number, value: string) => {
    if (!editingFlowData) return;
    const updatedEndpoints = [...(editingFlowData.apiEndpoints || [])];
    updatedEndpoints[index] = value;
    setEditingFlowData(prev => prev ? { ...prev, apiEndpoints: updatedEndpoints } : null);
  };

  const addEditEndpointField = () => {
    if (!editingFlowData) return;
    setEditingFlowData(prev => prev ? { ...prev, apiEndpoints: [...(prev.apiEndpoints || []), ''] } : null);
  };

  const removeEditEndpointField = (index: number) => {
    if (!editingFlowData || !editingFlowData.apiEndpoints) return;
    const updatedEndpoints = editingFlowData.apiEndpoints.filter((_, i) => i !== index);
    setEditingFlowData(prev => prev ? { ...prev, apiEndpoints: updatedEndpoints } : null);
  };

  const handleEditFlowSubmit = () => {
    if (!editingFlowData) return;
    const resultIdAsNumber = Number(editingFlowData.resultId);
    if (isNaN(resultIdAsNumber)) { // Check if resultId is a valid number
        alert("Result ID must be a valid number.");
        return;
    }
    updateFlowMutation.mutate({
        ...editingFlowData,
        resultId: resultIdAsNumber, // Ensure resultId is a number
        apiEndpoints: editingFlowData.apiEndpoints?.filter(ep => ep.trim() !== '') || []
    });
  };

  const handleDeleteFlow = (flowId: number) => {
    setFlowToDeleteId(flowId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteFlow = () => {
    if (flowToDeleteId !== null) {
      deleteFlowMutation.mutate(flowToDeleteId);
    }
  };

  const cancelDeleteFlow = () => {
    setIsConfirmDeleteModalOpen(false);
    setFlowToDeleteId(null);
  };

  const handleAnalyzeFlows = async (flowId: number) => {
    const flow = flowsForModal.find(f => f.id === flowId);
    if (!flow || typeof flow.resultId !== 'number') { 
      setAnalyzeError('Flow data is incomplete or resultId is missing. Cannot start analysis.');
      setAnalyzeResult(null);
      setAnalyzeLoading(false);
      setIsAnalyzeResultModalOpen(true);
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null); 

    // Construct the payload according to the updated FlowAnalysisRequestDTO
    const payload: FlowAnalysisRequestDTO = {
      flowName: flow.flowName,
      resultId: flow.resultId,
      apiEndpoints: flow.apiEndpoints || [],
      flowDescription: flow.flowDescription || '',
      appId: flow.appId
    };

    analyzeFlowMutation.mutate(payload);
  };

  const openViewFlowsModal = (app: ApplicationResponseDTO) => {
    setCurrentAppForModal(app);
    setIsViewFlowsModalOpen(true);
  };

  const closeViewFlowsModal = () => {
    setIsViewFlowsModalOpen(false);
    setCurrentAppForModal(null);
  };

  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={(appsError as Error)?.message || 'Failed to load applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen"> {/* Added bg-gray-50 and min-h-screen */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Business Flow Analyzer</h1> {/* Updated style */}
      
      {apps && apps.length > 0 ? (
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out"> {/* Enhanced card style */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-medium text-gray-800 mb-1">{app.appName}</h2> {/* Updated style */}
                  <p className="text-sm text-gray-500">URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl || 'N/A'}</a></p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openAddFlowModal(app)} 
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Flow
                  </button>
                  <button 
                    onClick={() => openViewFlowsModal(app)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.001.028-.002.055-.002.082 0 .027.001.054.002.082-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7-.001-.028-.002.055-.002.082 0 .027.001.054.002.082z" />
                    </svg>
                    View Flows
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No applications found. Please add an application first.</p>
      )}

      {/* Add New Flow Modal */}
      <Modal
        isOpen={isAddFlowModalOpen}
        onClose={closeAddFlowModal}
        onConfirm={handleAddFlowSubmit}
        title="Add New Business Flow"
        confirmButtonText="Add Flow"
        confirmButtonPosition="left"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="flowName" className="block text-sm font-medium text-gray-700">Flow Name</label>
            <input
              type="text"
              name="flowName"
              id="flowName"
              value={newFlowData.flowName}
              onChange={handleNewFlowInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter flow name" // Added placeholder
              required
            />
          </div>
          <div>
            <label htmlFor="flowDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="flowDescription"
              id="flowDescription"
              value={newFlowData.flowDescription}
              onChange={handleNewFlowInputChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter flow description" // Added placeholder
            />
          </div>
          <div>
            <label htmlFor="resultId" className="block text-sm font-medium text-gray-700">SonarQube Scan Result ID</label>
            <input
              type="number" // Changed to type number
              name="resultId"
              id="resultId"
              value={newFlowData.resultId}
              onChange={handleNewFlowInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter scan result ID"
              required // Added required
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">API Endpoints</h4>
            {newFlowData.apiEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => handleEndpointChange(index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="/api/v1/example"
                />
                {newFlowData.apiEndpoints.length > 1 && (
                  <button type="button" onClick={() => removeEndpointField(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addEndpointField} className="text-indigo-600 hover:text-indigo-800 text-sm mt-1">Add Endpoint</button>
          </div>
        </div>
        {addFlowMutation.isError && <ErrorDisplay message={(addFlowMutation.error as Error)?.message || 'Failed to add flow.'} />}
      </Modal>

      {/* View Flows Modal */}
      {currentAppForModal && (
        <Modal
          isOpen={isViewFlowsModalOpen}
          onClose={closeViewFlowsModal}
          title={`Business Flows for ${currentAppForModal.appName.toUpperCase()}`}
          showConfirmButton={false}
          cancelButtonText="Close"
          maxWidthClass="max-w-2xl" 
        >
          {flowsForModal.length > 0 ? (
            <ul className="space-y-4"> 
              {flowsForModal.map(flow => (
                <li key={flow.id} className="p-4 bg-slate-100 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3"> 
                    <div className="pr-4 flex-grow min-w-0"> 
                      <h4 className="font-semibold text-lg text-indigo-700 truncate">{flow.flowName.toUpperCase()}</h4> {/* Increased font size and weight */}
                      <p className="text-sm text-gray-700 mt-1.5"><strong>Description:</strong> {flow.flowDescription || 'N/A'}</p> {/* Increased font size and text color */}
                      {flow.apiEndpoints && flow.apiEndpoints.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-sm text-gray-700"><strong>API Endpoints:</strong></p> {/* Increased font size and text color */}
                          <ul className="list-disc list-inside pl-4 space-y-0.5 mt-1">
                            {flow.apiEndpoints.map((ep, idx) => <li key={idx} className="text-sm text-gray-600 truncate">{ep}</li>)} {/* Increased font size and text color */}
                          </ul>
                        </div>
                      )}
                       <p className="text-sm text-gray-700 mt-1.5"><strong>SonarQube Scan Result ID:</strong> {flow.resultId || 'N/A'}</p> {/* Increased font size and text color */}
                    </div>
                    <div className="flex space-x-1.5 flex-shrink-0"> 
                        <button 
                            onClick={() => openEditFlowModal(flow)}
                            className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium whitespace-nowrap flex items-center" // Increased padding and font size
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"> {/* Increased icon size and margin */}
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                            Edit
                        </button>
                        <button 
                            onClick={() => handleDeleteFlow(flow.id)} 
                            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium whitespace-nowrap flex items-center" // Increased padding and font size
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"> {/* Increased icon size and margin */}
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                        </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2"> 
                        <button 
                            onClick={() => handleAnalyzeFlows(flow.id)}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-medium whitespace-nowrap flex items-center" // Increased padding and font size
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"> {/* Increased icon size and margin */}
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            Analyze
                        </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No business flows found for this application.</p>
          )}
        </Modal>
      )}
      
      {/* Edit Flow Modal */}
      {editingFlowData && (
        <Modal
            isOpen={isEditFlowModalOpen}
            onClose={closeEditFlowModal}
            onConfirm={handleEditFlowSubmit}
            title={`Edit Flow: ${editingFlowData.flowName.toUpperCase()}`}
            confirmButtonText="Save Changes"
            confirmButtonPosition="left"
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="editFlowName" className="block text-sm font-medium text-gray-700">Flow Name</label>
                    <input
                        type="text"
                        name="flowName"
                        id="editFlowName"
                        value={editingFlowData.flowName}
                        onChange={handleEditFlowInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="editFlowDescription" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="flowDescription"
                        id="editFlowDescription"
                        value={editingFlowData.flowDescription || ''}
                        onChange={handleEditFlowInputChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="editResultId" className="block text-sm font-medium text-gray-700">Related Scan Result ID</label>
                    <input
                        type="number" // Changed to type number
                        name="resultId"
                        id="editResultId"
                        value={editingFlowData.resultId || ''} // Keep existing value or empty string
                        onChange={handleEditFlowInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter scan result ID"
                        required // Added required
                    />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">API Endpoints</h4>
                    {(editingFlowData.apiEndpoints || []).map((endpoint, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                            <input
                                type="text"
                                value={endpoint}
                                onChange={(e) => handleEditEndpointChange(index, e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="/api/v1/example"
                            />
                            {(editingFlowData.apiEndpoints || []).length > 1 && (
                                <button type="button" onClick={() => removeEditEndpointField(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addEditEndpointField} className="text-indigo-600 hover:text-indigo-800 text-sm mt-1">Add Endpoint</button>
                </div>
            </div>
            {updateFlowMutation.isError && <ErrorDisplay message={(updateFlowMutation.error as Error)?.message || 'Failed to update flow.'} />}
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={cancelDeleteFlow}
        onConfirm={confirmDeleteFlow}
        title="Confirm Delete Flow"
        confirmButtonText="Delete"
        confirmButtonPosition="left"
      >
        <p className="text-gray-700">Are you sure you want to delete this business flow? This action cannot be undone.</p>
        {deleteFlowMutation.isError && (
            <div className="mt-2">
                <ErrorDisplay message={(deleteFlowMutation.error as Error)?.message || 'Failed to delete flow.'} />
            </div>
        )}
      </Modal>

      {/* Analyze Result Modal */}
      <Modal
        isOpen={isAnalyzeResultModalOpen}
        onClose={() => { 
          setIsAnalyzeResultModalOpen(false); 
          setAnalyzeResult(null); 
          setAnalyzeError(null); 
          setAnalyzeLoading(false); // Reset loading state when modal is closed
        }}
        title="Business Flow Analysis Result"
        showConfirmButton={false}
        cancelButtonText="Close"
        maxWidthClass="max-w-2xl" // Added to match View Flows modal size
      >
        {analyzeLoading ? (
          <div className="py-8 flex justify-center"><Loading /></div>
        ) : analyzeError ? (
          <ErrorDisplay message={analyzeError} />
        ) : analyzeResult && analyzeResult.data ? (
          <div className="space-y-3">
            <div className="bg-slate-100 rounded p-4">
              <h3 className="text-lg font-semibold text-indigo-700 mb-1">{analyzeResult.data.flowName}</h3>
              <p className="text-sm text-gray-700 mb-1"><strong>Description:</strong> {analyzeResult.data.flowDescription}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mt-2"> {/* Adjusted gap */}
                <span><strong>Total Steps:</strong> {analyzeResult.data.totalSteps}</span>
                <span><strong>Passed Steps:</strong> {analyzeResult.data.passedSteps}</span>
                <span><strong>Static Issues:</strong> {analyzeResult.data.totalStaticIssues}</span>
                <span><strong>Overall Passed:</strong> {analyzeResult.data.overallPassed ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</span>
              </div>
            </div>
            {analyzeResult.data.stepResults && analyzeResult.data.stepResults.length > 0 ? (
              <div className="mt-2">
                <h4 className="font-semibold text-gray-800 mb-2">Step Results</h4>
                <ul className="space-y-2">
                  {analyzeResult.data.stepResults.map((step: StepResult, idx: number) => ( // Use StepResult type
                    <li key={idx} className="bg-white rounded shadow p-3 flex flex-col md:flex-row md:items-center md:justify-between"> {/* Use index as key if step.id is not available */}
                      <div className="flex-grow">
                        <span className="font-medium text-gray-700">Endpoint:</span> <span className="text-indigo-600 break-all">{step.endpoint}</span>
                      </div>
                      <div className="flex gap-x-4 gap-y-1 mt-1 md:mt-0 md:ml-4 flex-shrink-0"> {/* Adjusted gap and margin */}
                        <span><strong>Static Issues:</strong> {step.staticIssueCount}</span>
                        <span><strong>Passed:</strong> {step.passed ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No step results available.</p>
            )}
            {/* Optional: Display timestamp if available in your API response */}
            {/* <div className="text-xs text-gray-400 mt-2">Timestamp: {analyzeResult.data.timestamp}</div> */}
          </div>
        ) : (
          <div className="text-gray-500">No analysis result.</div>
        )}
      </Modal>

    </div>
  );
};

export default FlowAnalyzer;
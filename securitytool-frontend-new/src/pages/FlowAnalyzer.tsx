import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFlow, getFlows, updateFlow, deleteFlow } from '../api/flowApi';
import { fetchApplications } from '../api/applicationApi';
import { ApplicationResponseDTO } from '../types/application';
import { NewFlowPayload, BusinessFlowResponseDTO } from '../types/flow';
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

  const handleAnalyzeFlows = (flowId: number) => {
    console.log("Analyze flow:", flowId);
    alert(`Trigger analysis for flow ID: ${flowId}`);
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
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{app.appName}</h2> {/* Updated style */}
                  <p className="text-sm text-gray-500">URL: {app.appUrl || 'N/A'}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openAddFlowModal(app)} 
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Add New Flow
                  </button>
                  <button 
                    onClick={() => openViewFlowsModal(app)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
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
            <label htmlFor="resultId" className="block text-sm font-medium text-gray-700">Related Scan Result ID</label>
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
            <ul className="space-y-3">
              {flowsForModal.map(flow => (
                <li key={flow.id} className="p-3 bg-gray-50 rounded-md shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-md text-indigo-700">{flow.flowName.toUpperCase()}</h4>
                      <p className="text-xs text-gray-600 mt-1"><strong>Description:</strong> {flow.flowDescription || 'N/A'}</p>
                      {flow.apiEndpoints && flow.apiEndpoints.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-600"><strong>API Endpoints:</strong></p>
                          <ul className="list-disc list-inside pl-4">
                            {flow.apiEndpoints.map((ep, idx) => <li key={idx} className="text-xs text-gray-500">{ep}</li>)}
                          </ul>
                        </div>
                      )}
                       <p className="text-xs text-gray-500 mt-1"><strong>Related Scan Result ID:</strong> {flow.resultId || 'N/A'}</p>
                    </div>
                    <div className="flex flex-col space-y-1.5 items-end ml-2 flex-shrink-0">
                        <button 
                            onClick={() => openEditFlowModal(flow)}
                            className="px-2.5 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs w-full text-center"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => handleDeleteFlow(flow.id)}
                            className="px-2.5 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs w-full text-center"
                        >
                            Delete
                        </button>
                        <button 
                            onClick={() => handleAnalyzeFlows(flow.id)}
                            className="px-2.5 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs w-full text-center"
                        >
                            Analyze
                        </button>
                    </div>
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
        title="Confirm Delete"
        confirmButtonText="Delete"
        confirmButtonPosition="left"
      >
        <p>Are you sure you want to delete this business flow? This action cannot be undone.</p>
        {deleteFlowMutation.isError && <ErrorDisplay message={(deleteFlowMutation.error as Error)?.message || 'Failed to delete flow.'} />}
      </Modal>

    </div>
  );
};

export default FlowAnalyzer;
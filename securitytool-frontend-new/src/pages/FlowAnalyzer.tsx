import React, { useState, useMemo } from 'react'; // Added useMemo
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { createFlow, getFlows, updateFlow, deleteFlow } from '../api/flowApi'; // Added updateFlow and deleteFlow
import { fetchApplications } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
// import { SecurityIssueResponseDTO } from '../types/report'; 
import { ApplicationResponseDTO } from '../types/application';
import { NewFlowPayload, BusinessFlowResponseDTO } from '../types/flow'; // Ensure BusinessFlowResponseDTO is imported

const FlowAnalyzer: React.FC = () => {
  const queryClient = useQueryClient(); // Initialize queryClient

  const addFlowMutation = useMutation<BusinessFlowResponseDTO, Error, NewFlowPayload>({
    mutationFn: createFlow,
    onSuccess: () => {
      // alert('Flow added successfully!'); // Removed alert
      setIsAddFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] }); 
      // TODO: Consider adding a toast notification for better UX
    },
    onError: (error) => {
      alert(`Failed to add flow: ${error.message}`);
    }
  });

  const updateFlowMutation = useMutation<BusinessFlowResponseDTO, Error, BusinessFlowResponseDTO>({
    mutationFn: updateFlow,
    onSuccess: () => {
      alert('Flow updated successfully!'); // Added alert for successful update
      setIsEditFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
      // TODO: Consider replacing alert with a toast notification for better UX
    },
    onError: (error) => {
      alert(`Failed to update flow: ${error.message}`);
    }
  });

  const deleteFlowMutation = useMutation<void, Error, number>({
    mutationFn: deleteFlow,
    onSuccess: () => {
      // alert('Flow deleted successfully!'); // Removed alert
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
      // TODO: Consider adding a toast notification for better UX
    },
    onError: (error) => {
      alert(`Failed to delete flow: ${error.message}`);
    }
  });

  // Modal state for Add New Flow
  const [isAddFlowModalOpen, setIsAddFlowModalOpen] = useState(false);
  const [newFlowData, setNewFlowData] = useState<Omit<NewFlowPayload, 'appId' | 'resultId' | 'apiEndpoints'> & { appId: string; resultId: string; apiEndpoints: string[] }>({
    appId: '',
    flowName: '',
    resultId: '', // Changed from sonarQubeResultId
    flowDescription: '', // Changed from description
    apiEndpoints: [''] // Changed from endpoints, initialize with one empty endpoint field
  });

  // State for View Flows Modal
  const [isViewFlowsModalOpen, setIsViewFlowsModalOpen] = useState(false);
  const [currentAppForModal, setCurrentAppForModal] = useState<ApplicationResponseDTO | null>(null);

  // Modal State for Edit Flow
  const [isEditFlowModalOpen, setIsEditFlowModalOpen] = useState(false);
  const [editingFlowData, setEditingFlowData] = useState<BusinessFlowResponseDTO | null>(null);

  // Modal State for Confirm Delete
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
          appId: Number((app as any).id), // Ensure appId is correctly mapped
        }));
      }
    });

  // Query to fetch all business flows
  const {
    data: allBusinessFlows,
    isLoading: flowsLoading,
    isError: flowsIsError,
    error: flowsError,
  } = useQuery<BusinessFlowResponseDTO[], Error>({
    queryKey: ['businessFlows'],
    queryFn: getFlows,
  });

  // Memoized flows for the modal
  const flowsForModal = useMemo(() => {
    if (!currentAppForModal || !allBusinessFlows) {
      return [];
    }
    return allBusinessFlows.filter(flow => flow.appId === currentAppForModal.appId);
  }, [allBusinessFlows, currentAppForModal]);

  // Handlers for Add New Flow Modal
  const openAddFlowModal = (appId: number) => {
    const app = apps?.find(a => a.appId === appId);
    if (app) {
      setNewFlowData({
        appId: app.appId.toString(),
        flowName: '',
        resultId: '',
        flowDescription: '',
        apiEndpoints: ['']
      });
      setIsAddFlowModalOpen(true);
    }
  };

  const closeAddFlowModal = () => {
    setIsAddFlowModalOpen(false);
  };

  const handleNewFlowInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewFlowData(prev => ({ ...prev, [name]: value }));
  };

  const handleEndpointChange = (index: number, value: string) => {
    setNewFlowData(prev => {
      const endpoints = [...prev.apiEndpoints];
      endpoints[index] = value;
      return { ...prev, apiEndpoints: endpoints };
    });
  };

  const addEndpointField = () => {
    setNewFlowData(prev => ({
      ...prev,
      apiEndpoints: [...prev.apiEndpoints, '']
    }));
  };

  const removeEndpointField = (index: number) => {
    setNewFlowData(prev => {
      const endpoints = prev.apiEndpoints.filter((_, i) => i !== index);
      return { ...prev, apiEndpoints: endpoints };
    });
  };

  const handleAddFlowSubmit = () => {
    // Validate that appId and resultId are not empty and are valid numbers
    const appIdNumber = parseInt(newFlowData.appId, 10);
    const resultIdNumber = parseInt(newFlowData.resultId, 10);

    if (isNaN(appIdNumber)) {
      alert('Application ID is invalid.');
      return;
    }
    if (isNaN(resultIdNumber)) {
      alert('Result ID must be a valid number.');
      return;
    }
    if (!newFlowData.flowName.trim()) {
      alert('Flow Name is required.');
      return;
    }
    // Ensure at least one endpoint is provided and it's not empty
    if (newFlowData.apiEndpoints.length === 0 || newFlowData.apiEndpoints.some(ep => !ep.trim())) {
        alert('At least one non-empty API Endpoint is required.');
        return;
    }

    addFlowMutation.mutate({
      ...newFlowData,
      appId: appIdNumber,
      resultId: resultIdNumber,
      // Filter out any empty endpoint strings before submitting
      apiEndpoints: newFlowData.apiEndpoints.filter(ep => ep.trim() !== ''),
    });
  };

  // Handlers for Edit Flow Modal
  const openEditFlowModal = (flow: BusinessFlowResponseDTO) => {
    setEditingFlowData(flow);
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
    setEditingFlowData(prev => {
      if (!prev) return null;
      const apiEndpoints = [...(prev.apiEndpoints || [])];
      apiEndpoints[index] = value;
      return { ...prev, apiEndpoints };
    });
  };

  const addEditEndpointField = () => {
    if (!editingFlowData) return;
    setEditingFlowData(prev => prev ? { ...prev, apiEndpoints: [...(prev.apiEndpoints || []), ''] } : null);
  };

  const removeEditEndpointField = (index: number) => {
    if (!editingFlowData) return;
    setEditingFlowData(prev => {
      if (!prev) return null;
      const apiEndpoints = (prev.apiEndpoints || []).filter((_, i) => i !== index);
      return { ...prev, apiEndpoints };
    });
  };

  const handleEditFlowSubmit = () => {
    if (!editingFlowData) return;

    // Basic validation for editing flow
    if (!editingFlowData.flowName.trim()) {
      alert('Flow Name is required.');
      return;
    }
    if (editingFlowData.apiEndpoints && (editingFlowData.apiEndpoints.length === 0 || editingFlowData.apiEndpoints.some(ep => !ep.trim())) ){
      alert('At least one non-empty API Endpoint is required if endpoints are provided.');
      return;
    }
    
    const flowToUpdate: BusinessFlowResponseDTO = {
        ...editingFlowData,
        resultId: editingFlowData.resultId ? Number(editingFlowData.resultId) : undefined,
        apiEndpoints: (editingFlowData.apiEndpoints || []).filter(ep => ep.trim() !== '')
    };

    updateFlowMutation.mutate(flowToUpdate);
  };

  // Handler for Deleting a Flow
  const handleDeleteFlow = (flowId: number) => {
    setFlowToDeleteId(flowId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteFlow = () => {
    if (flowToDeleteId !== null) {
      deleteFlowMutation.mutate(flowToDeleteId);
      setIsConfirmDeleteModalOpen(false);
      setFlowToDeleteId(null);
    }
  };

  const cancelDeleteFlow = () => {
    setIsConfirmDeleteModalOpen(false);
    setFlowToDeleteId(null);
  };

  // Placeholder handler for Analyze button in View Flows modal
  const handleAnalyzeFlows = (flowId: number) => {
    // TODO: Implement analysis logic for the selected flow
    const flowToAnalyze = flowsForModal.find(f => f.id === flowId);
    if (currentAppForModal && flowToAnalyze) {
      alert(`Analyze button clicked for flow: ${flowToAnalyze.flowName} (ID: ${flowId}) of ${currentAppForModal.appName}`);
      // This is where you would trigger the analysis for the specific flowToAnalyze
      // For example, by calling another mutation or API with flowId or flowToAnalyze details
    } else {
      alert("Could not find the flow or application context to analyze.");
    }
  };

  // Handler to open View Flows Modal
  const openViewFlowsModal = async (app: ApplicationResponseDTO) => { // Made async
    setCurrentAppForModal(app);
    try {
      await queryClient.refetchQueries({ queryKey: ['businessFlows'] });
    } catch (e) {
      console.error("Failed to refetch flows:", e);
      // Optionally, show an error to the user
    }
    setIsViewFlowsModalOpen(true);
  };

  const closeViewFlowsModal = () => {
    setIsViewFlowsModalOpen(false);
    setCurrentAppForModal(null); // Reset current app for modal
  };


  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={appsError?.message || 'Failed to load applications'} />;

  return (
      <div className="p-6">
        <h1 className="text-2xl mb-4">Flow Analyzer</h1>
        
        {(addFlowMutation.isPending || flowsLoading) && <Loading />} {/* Added flowsLoading */}
        {addFlowMutation.isError && <ErrorDisplay message={addFlowMutation.error?.message} />}
        {flowsIsError && <ErrorDisplay message={flowsError?.message || 'Failed to load business flows'} />} {/* Added flowsError display */}

        {apps && apps.length > 0 ? (
          <ul className="space-y-4">
            {apps
              .filter(app => app && app.appId !== undefined && app.appId !== null) 
              .map(app => {
                const appFlowsCount = allBusinessFlows?.filter(flow => flow.appId === app.appId).length || 0;
                return (
                  <li key={app.appId} className="p-4 bg-white rounded shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <div>App Name: <span className="font-bold text-lg">{app.appName}</span></div>
                        <div className="text-gray-600">App URL: {app.appUrl || 'N/A'}</div>
                      </div>
                      <div className="space-x-2">
                        <button 
                          onClick={() => openAddFlowModal(app.appId)} 
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Add Business Flow
                        </button>
                        <button 
                          onClick={() => openViewFlowsModal(app)} 
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          View Flows ({appFlowsCount})
                        </button>
                      </div>
                    </div>
                  </li>
                );
            })}
          </ul>
        ) : (
          <div className="p-4 bg-white rounded shadow text-center text-gray-600">
            No applications found. Please add an application first.
          </div>
        )}
        

        {/* Modal for Add New Flow */}
        <Modal 
            isOpen={isAddFlowModalOpen} 
            onClose={closeAddFlowModal} 
            title="Add New Business Flow"
            showConfirmButton={true}
            confirmButtonText="Add Flow"
            onConfirm={handleAddFlowSubmit}
            showCancelButton={true}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="appNameDisplay" className="block text-sm font-medium text-gray-700">Application</label>
              <input
                type="text"
                id="appNameDisplay"
                value={
                  apps?.find(a => a && a.appId != null && a.appId.toString() === newFlowData.appId)?.appName || 
                  (newFlowData.appId ? 'Loading app name...' : 'No application context')
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100"
                disabled
              />
            </div>
            <div>
              <label htmlFor="flowName" className="block text-sm font-medium text-gray-700">Flow Name</label>
              <input 
                type="text" 
                id="flowName"
                name="flowName" 
                value={newFlowData.flowName} 
                onChange={handleNewFlowInputChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter Flow Name"
                required
              />
            </div>
            <div>
              <label htmlFor="resultId" className="block text-sm font-medium text-gray-700">SonarQube Result ID</label> 
              <input 
                type="number" 
                id="resultId"
                name="resultId" 
                value={newFlowData.resultId} 
                onChange={handleNewFlowInputChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter SonarQube Result ID" 
                required 
              />
            </div>
            <div>
              <label htmlFor="flowDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="flowDescription"
                name="flowDescription"
                value={newFlowData.flowDescription}
                onChange={handleNewFlowInputChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter Flow Description"
              />
            </div>
            {/* API Endpoints - Dynamic List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoints</label>
              {newFlowData.apiEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => handleEndpointChange(index, e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., /api/login"
                  />
                  {newFlowData.apiEndpoints.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeEndpointField(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addEndpointField}
                className="mt-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Add Endpoint
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal for View Flows */}
        <Modal
          isOpen={isViewFlowsModalOpen && currentAppForModal !== null}
          onClose={closeViewFlowsModal}
          title={currentAppForModal ? `Business Flows for ${currentAppForModal.appName}` : 'Business Flows'}
          showConfirmButton={false} // No global Analyze button in footer
          showCancelButton={true}
          cancelButtonText="Close"
          maxWidthClass="max-w-2xl" // Increased modal width
        >
          {(flowsLoading || deleteFlowMutation.isPending || updateFlowMutation.isPending) && <Loading />}
          {flowsError && <ErrorDisplay message={flowsError.message || 'Failed to load flows'} />}
          {deleteFlowMutation.isError && <ErrorDisplay message={deleteFlowMutation.error.message} />}
          {updateFlowMutation.isError && <ErrorDisplay message={updateFlowMutation.error.message} />}

          {!flowsLoading && !flowsError && flowsForModal.length > 0 ? (
            <ul className="space-y-3">
              {flowsForModal.map(flow => (
                <li key={flow.id} className="p-3 bg-gray-50 rounded shadow-sm">
                  {/* Top section: Flow Name and Edit/Delete buttons */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-md">{flow.flowName.toUpperCase()}</h4>
                    <div className="space-x-2 flex-shrink-0">
                      <button
                        onClick={() => openEditFlowModal(flow)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        disabled={deleteFlowMutation.isPending && deleteFlowMutation.variables === flow.id}
                      >
                        {deleteFlowMutation.isPending && deleteFlowMutation.variables === flow.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Middle section: Flow Details */}
                  {flow.flowDescription && <p className="text-sm text-gray-600 mt-1"><span className="font-bold">Description:</span> {flow.flowDescription}</p>}
                  {flow.apiEndpoints && flow.apiEndpoints.length > 0 && (
                    <div className="mt-1">
                      <p className="text-sm text-gray-600"><span className="font-bold">API Endpoints:</span></p>
                      <ul className="list-disc list-inside pl-4 text-sm text-gray-500">
                        {flow.apiEndpoints.map((ep, idx) => <li key={idx}>{ep}</li>)}
                      </ul>
                    </div>
                  )}
                  {flow.resultId != null && <p className="text-sm text-gray-600 mt-1"><span className="font-bold">SonarQube Result ID:</span> {flow.resultId}</p>}

                  {/* Bottom section: Analyze Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleAnalyzeFlows(flow.id)} // Pass flow.id to the handler
                      className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-sm"
                    >
                      Analyze
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !flowsLoading && !flowsError && <p>No business flows found for this application.</p>
          )}
        </Modal>

        {/* Modal for Edit Flow */}
        {editingFlowData && (
          <Modal
            isOpen={isEditFlowModalOpen}
            onClose={closeEditFlowModal}
            title={`Edit Business Flow: ${editingFlowData.flowName}`}
            showConfirmButton={true}
            confirmButtonText="Save Changes"
            onConfirm={handleEditFlowSubmit}
            showCancelButton={true}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="editFlowName" className="block text-sm font-medium text-gray-700">Flow Name</label>
                <input 
                  type="text" 
                  id="editFlowName"
                  name="flowName" 
                  value={editingFlowData.flowName}
                  onChange={handleEditFlowInputChange} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="editResultId" className="block text-sm font-medium text-gray-700">Result ID</label> 
                <input 
                  type="number" 
                  id="editResultId"
                  name="resultId" 
                  value={editingFlowData.resultId || ''} 
                  onChange={handleEditFlowInputChange} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="editFlowDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="editFlowDescription"
                  name="flowDescription"
                  value={editingFlowData.flowDescription || ''}
                  onChange={handleEditFlowInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoints</label>
                {(editingFlowData.apiEndpoints || []).map((endpoint, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => handleEditEndpointChange(index, e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., /api/login"
                    />
                    <button 
                        type="button" 
                        onClick={() => removeEditEndpointField(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        Remove
                      </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addEditEndpointField}
                  className="mt-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Add Endpoint
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal for Confirm Delete */}
        <Modal
          isOpen={isConfirmDeleteModalOpen}
          onClose={cancelDeleteFlow}
          title="Confirm Deletion"
          showConfirmButton={true}
          confirmButtonText="Delete"
          onConfirm={confirmDeleteFlow}
          showCancelButton={true}
          cancelButtonText="Cancel"
        >
          <p>Are you sure you want to delete this flow? This action cannot be undone.</p>
        </Modal>
        
      </div>
  );
};

export default FlowAnalyzer;
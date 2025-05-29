import React, { useState, useMemo, useRef, useEffect } from 'react'; // Added useRef
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFlow, getFlows, updateFlow, deleteFlow, analyzeBusinessFlow } from '../api/flowApi';
import { fetchApplications, searchApplications, PaginatedApplications } from '../api/applicationApi';
import { ApplicationResponseDTO } from '../types/application';
import { NewFlowPayload, BusinessFlowResponseDTO, AnalyzeFlowApiResponse, FlowAnalysisRequestDTO, StepResult } from '../types/flow'; // Added StepResult, removed AnalyzeFlowData
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';

const FlowAnalyzer: React.FC = () => {
  const queryClient = useQueryClient();
  const analysisStartTimeRef = useRef<number | null>(null); // Ref for analysis start time
  // Success modal state for edit flow
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);

  const [isAddFlowModalOpen, setIsAddFlowModalOpen] = useState(false);
  const [isViewFlowsModalOpen, setIsViewFlowsModalOpen] = useState(false);
  const [isEditFlowModalOpen, setIsEditFlowModalOpen] = useState(false);
  const [editingFlowData, setEditingFlowData] = useState<BusinessFlowResponseDTO | null>(null);
  const [currentAppForModal, setCurrentAppForModal] = useState<ApplicationResponseDTO | null>(null);
  const [newFlowData, setNewFlowData] = useState<NewFlowPayload>({
    appId: 0, // Changed to number
    flowName: '',
    resultId: 0, // Changed to number
    flowDescription: '',
    apiEndpoints: ['']
  });

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [flowToDeleteId, setFlowToDeleteId] = useState<number | null>(null);

  const [isAnalyzeResultModalOpen, setIsAnalyzeResultModalOpen] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeFlowApiResponse | null>(null); // Updated type
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false); // State for completion message

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ApplicationResponseDTO[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [addFlowResultIdError, setAddFlowResultIdError] = useState<string | null>(null);
  const [editFlowResultIdError, setEditFlowResultIdError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  const addFlowMutation = useMutation<BusinessFlowResponseDTO, Error, NewFlowPayload>({
    mutationFn: createFlow,
    onSuccess: () => {
      setIsAddFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
    },
    onError: (error: any) => {
      // Show error below input instead of alert
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        setAddFlowResultIdError('Result ID not found.');
      } else {
        setAddFlowResultIdError(error.message || 'Failed to add flow.');
      }
    }
  });

  const updateFlowMutation = useMutation<BusinessFlowResponseDTO, Error, BusinessFlowResponseDTO>({
    mutationFn: updateFlow,
    onSuccess: () => {
      setIsEditFlowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessFlows'] });
    },
    onError: (error: any) => {
      // Show error below input instead of alert
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        setEditFlowResultIdError('Result ID not found.');
      } else {
        setEditFlowResultIdError(error.message || 'Failed to update flow.');
      }
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
      const startTime = analysisStartTimeRef.current;
      if (startTime) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 5000 - elapsedTime);
        setTimeout(() => {
          setAnalyzeResult(data);
          setAnalyzeLoading(false);
          setShowCompletionMessage(true);
        }, remainingTime);
      } else {
        // Fallback if startTime wasn't set (should not happen ideally)
        setAnalyzeResult(data);
        setAnalyzeLoading(false);
        setShowCompletionMessage(true);
      }
    },
    onError: (error) => {
      const startTime = analysisStartTimeRef.current;
      if (startTime) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 5000 - elapsedTime);
        setTimeout(() => {
          setAnalyzeError(error.message || 'Failed to analyze flow.');
          setAnalyzeResult(null);
          setAnalyzeLoading(false);
          // setShowCompletionMessage(false); // Already reset in handleAnalyzeFlows or onClose
        }, remainingTime);
      } else {
        // Fallback
        setAnalyzeError(error.message || 'Failed to analyze flow.');
        setAnalyzeResult(null);
        setAnalyzeLoading(false);
      }
    },
  });

  const { data: paginatedApps, isLoading: appsLoading, isError: appsIsError, error: appsError } = 
    useQuery<PaginatedApplications, Error>({
      queryKey: ['applications', page, pageSize],
      queryFn: () => fetchApplications(page, pageSize),
    });
  useEffect(() => {
    if (paginatedApps) {
      setTotalPages(paginatedApps.totalPages);
      setTotalElements(paginatedApps.totalElement);
    }
  }, [paginatedApps]);
  const apps: ApplicationResponseDTO[] = paginatedApps && Array.isArray((paginatedApps as any).content)
    ? (paginatedApps as any).content.map((app: any) => ({ ...app, appId: Number(app.id) }))
    : [];

  const {
    data: allBusinessFlows,
    isLoading: flowsLoading, 
    isError: flowsIsError,   
    error: flowsError,       
  } = useQuery<BusinessFlowResponseDTO[], Error>({
    queryKey: ['businessFlows'], // Query for all flows
    queryFn: getFlows,
    // No need to filter by currentAppForModal here, do it in useMemo
  });

  const flowsForModal = useMemo(() => {
    if (!allBusinessFlows || !currentAppForModal) return [];
    return allBusinessFlows.filter(flow => flow.appId === currentAppForModal.appId);
  }, [allBusinessFlows, currentAppForModal]);

  const openAddFlowModal = (app: ApplicationResponseDTO) => {
    setCurrentAppForModal(app);
    setNewFlowData({
      appId: app.appId, // app.appId is a number
      flowName: '',
      resultId: 0, // Default to 0
      flowDescription: '',
      apiEndpoints: ['']
    });
    setIsAddFlowModalOpen(true);
  };

  const closeAddFlowModal = () => {
    setIsAddFlowModalOpen(false);
    setNewFlowData({ appId: 0, flowName: '', resultId: 0, flowDescription: '', apiEndpoints: [''] }); // Reset with numbers
  };

  const openViewFlowsModal = (app: ApplicationResponseDTO) => {
    setCurrentAppForModal(app);
    setIsViewFlowsModalOpen(true);
  };

  const closeViewFlowsModal = () => {
    setIsViewFlowsModalOpen(false);
    // setCurrentAppForModal(null); // Do not reset currentAppForModal here if other modals for the same app might be opened subsequently
  };

  // Function to open the edit modal
  const openEditModal = (flow: BusinessFlowResponseDTO) => {
    setEditingFlowData({
        ...flow,
        apiEndpoints: flow.apiEndpoints && flow.apiEndpoints.length > 0 ? flow.apiEndpoints : ['']
    });
    setIsEditFlowModalOpen(true);
    setIsViewFlowsModalOpen(false); // Hide view flows modal when editing
  };

  const closeEditModal = () => {
    setEditingFlowData(null);
    setIsEditFlowModalOpen(false);
    setIsViewFlowsModalOpen(true); // Show view flows modal again when cancel is clicked
  };

  // Function to open the confirm delete modal
  const openConfirmDeleteModal = (flowId: number) => {
    setFlowToDeleteId(flowId);
    setIsConfirmDeleteModalOpen(true);
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
    if (isNaN(resultIdAsNumber)) {
        alert("Result ID must be a valid number.");
        return;
    }
    updateFlowMutation.mutate({
        ...editingFlowData,
        resultId: resultIdAsNumber,
        apiEndpoints: editingFlowData.apiEndpoints?.filter(ep => ep.trim() !== '') || []
    }, {
      onSuccess: () => {
        setIsEditFlowModalOpen(false);
        setIsViewFlowsModalOpen(true); // Show view flows modal again after successful save
        setShowEditSuccessModal(true); // Show success popup
      }
    });
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
      setShowCompletionMessage(false);
      setIsAnalyzeResultModalOpen(true);
      return;
    }

    analysisStartTimeRef.current = Date.now(); // Record start time
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);   
    setShowCompletionMessage(false); // Reset completion message visibility
    setIsAnalyzeResultModalOpen(true); 

    const payload: FlowAnalysisRequestDTO = {
      flowName: flow.flowName,
      resultId: flow.resultId,
      apiEndpoints: flow.apiEndpoints || [],
      flowDescription: flow.flowDescription || '',
      appId: flow.appId
    };

    analyzeFlowMutation.mutate(payload);
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      if (!searchTerm.trim()) {
        setSearchResults(null);
        setSearching(false);
        return;
      }
      const results = await searchApplications(searchTerm.trim());
      setSearchResults(results.map(app => ({ ...app, appId: Number((app as any).id) })));
    } catch (err: any) {
      setSearchError(err.message || 'Search failed.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  if (appsLoading) return <Loading />;
  if (appsIsError) return <ErrorDisplay message={(appsError as Error)?.message || 'Failed to load applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mr-4">Business Flow Analyzer</h1>
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex rounded-full shadow-sm bg-white border border-gray-300">
            <span className="flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
            </span>
            <input
              type="text"
              className="pl-2 pr-2 py-2 border-0 rounded-full focus:outline-none focus:border-gray-300 w-56 bg-transparent"
              placeholder="Search by Application name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-full font-semibold flex items-center transition-colors hover:bg-blue-600 focus:outline-none border-0 shadow-none"
              disabled={searching}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
          
            </button>
          </div>
          {searchTerm && (
            <button
              type="button"
              className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-full border border-gray-200 bg-gray-100"
              onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchError(null); }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {searchError && <div className="mb-2"><ErrorDisplay message={searchError} /></div>}

      {(searchResults !== null ? searchResults : apps) && (searchResults !== null ? searchResults : apps)!.length > 0 ? (
        <div className="space-y-4">
          {(searchResults !== null ? searchResults : apps)!.map(app => (
            <div key={app.appId} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out">
              <div className="flex justify-between items-center">
                <div className="flex-grow mr-4">
                  {/* Combine name and URL */}
                  <h2 className="text-xl font-medium text-gray-800 mb-1">
                    {app.appName}:&nbsp;
                    <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl || 'N/A'}</a>
                  </h2>
                  {/* Removed separate URL line */}
                  {/* Flows for this app */}
                  <div className="mt-2">
                    {/* Redesigned Flows: Total */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Flows</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-200 text-yellow-900 text-sm font-bold shadow border border-yellow-300">
                        {allBusinessFlows && allBusinessFlows.filter(f => f.appId === app.appId).length}
                      </span>
                    </div>
                    {allBusinessFlows && allBusinessFlows.filter(f => f.appId === app.appId).length > 0 ? (
                      <ul className="flex flex-col gap-1 ml-6 mt-1">
                        {allBusinessFlows.filter(f => f.appId === app.appId).map(flow => (
                          <li key={flow.id} className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 bg-indigo-200 text-indigo-900 rounded-full text-sm font-semibold shadow-sm hover:bg-indigo-300 transition-colors cursor-default border border-indigo-300">
                              <svg className="w-4 h-4 mr-1 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              {flow.flowName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic ml-2">N/A</span>
                    )}
                  </div>
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
        <div className="space-y-6">
          <div>
            <label htmlFor="flowName" className="block text-sm font-semibold text-gray-700 mb-1">Flow Name</label>
            <input
              type="text"
              name="flowName"
              id="flowName"
              value={newFlowData.flowName}
              onChange={handleNewFlowInputChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              placeholder="Enter flow name"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="flowDescription" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              name="flowDescription"
              id="flowDescription"
              value={newFlowData.flowDescription}
              onChange={handleNewFlowInputChange}
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              placeholder="Enter flow description"
            />
          </div>
          <div>
            <label htmlFor="resultId" className="block text-sm font-semibold text-gray-700 mb-1">SonarQube Scan Result ID</label>
            <input
              type="number"
              name="resultId"
              id="resultId"
              value={newFlowData.resultId}
              onChange={e => {
                handleNewFlowInputChange(e);
                // Validation: ZAP scan result IDs are not allowed
                const val = e.target.value;
                if (val && isNaN(Number(val))) {
                  setAddFlowResultIdError('Only SonarQube scan result IDs are allowed.');
                } else if (val && String(val).toLowerCase().includes('zap')) {
                  setAddFlowResultIdError('ZAP scan result IDs are not allowed.');
                } else {
                  setAddFlowResultIdError(null);
                }
              }}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
              placeholder="Enter scan result ID"
              min={0}
            />
            {addFlowResultIdError && (
              <div className="text-red-600 text-xs mt-1">{addFlowResultIdError}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">API Endpoints</label>
            <div className="space-y-2">
              {newFlowData.apiEndpoints.map((endpoint, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={endpoint}
                    onChange={e => handleEndpointChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                    placeholder="/api/v1/example"
                  />
                  {newFlowData.apiEndpoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEndpointField(idx)}
                      className="text-xs text-red-600 hover:underline px-2 py-1 rounded focus:outline-none"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEndpointField}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium focus:outline-none"
            >
              + Add Endpoint
            </button>
          </div>
        </div>
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
                <li key={flow.id} className="p-4 bg-slate-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out"> 
                  <div className="flex justify-between items-start mb-2"> 
                    <div className="pr-4 flex-grow min-w-0">
                      <h4 
                        className="text-lg font-semibold text-indigo-700 truncate hover:text-indigo-800 transition-colors" 
                        title={flow.flowName}
                      >
                        {flow.flowName.toUpperCase()}
                      </h4>
                      <p 
                        className="text-sm text-gray-600 mt-1.5 truncate" 
                        title={flow.flowDescription || undefined}
                      >
                        <strong className="font-medium text-gray-700">Description:</strong> {flow.flowDescription || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                      
                      {flow.apiEndpoints && flow.apiEndpoints.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-sm font-medium text-gray-700 mb-1.5">API Endpoints:</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            {flow.apiEndpoints.map((endpoint, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full shadow-sm hover:bg-indigo-200 transition-colors cursor-default inline-block max-w-[200px] sm:max-w-xs truncate" 
                                title={endpoint}
                              >
                                {endpoint}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mt-2.5">
                        <strong className="font-medium text-gray-700">SonarQube Scan Result ID:</strong> {flow.resultId}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1.5 flex-shrink-0"> 
                        <button 
                            onClick={() => openEditModal(flow)} // Corrected: Was handleEditFlow
                            className="px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs font-medium whitespace-nowrap flex items-center justify-center w-full sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            Edit
                        </button>
                        <button 
                            onClick={() => openConfirmDeleteModal(flow.id)} // Corrected: Was confirmDelete
                            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium whitespace-nowrap flex items-center justify-center w-full sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Delete
                        </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3 border-t pt-3"> 
                    <button 
                      onClick={() => handleAnalyzeFlows(flow.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium whitespace-nowrap flex items-center shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                      Analyze Flow
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
            onClose={closeEditModal}
            onConfirm={handleEditFlowSubmit}
            title={`Edit Flow: ${editingFlowData.flowName.toUpperCase()}`}
            confirmButtonText="Save Changes"
            confirmButtonPosition="left"
        >
            <div className="space-y-6">
                <div>
                    <label htmlFor="editFlowName" className="block text-sm font-semibold text-gray-700 mb-1">Flow Name</label>
                    <input
                        type="text"
                        name="flowName"
                        id="editFlowName"
                        value={editingFlowData.flowName}
                        onChange={handleEditFlowInputChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="editFlowDescription" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                        name="flowDescription"
                        id="editFlowDescription"
                        value={editingFlowData.flowDescription}
                        onChange={handleEditFlowInputChange}
                        rows={3}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                        placeholder="Enter flow description"
                    />
                </div>
                <div>
                    <label htmlFor="editResultId" className="block text-sm font-semibold text-gray-700 mb-1">SonarQube Scan Result ID</label>
                    <input
                        type="number"
                        name="resultId"
                        id="editResultId"
                        value={editingFlowData.resultId}
                        onChange={e => {
                          handleEditFlowInputChange(e);
                          // Validation: ZAP scan result IDs are not allowed
                          const val = e.target.value;
                          if (val && isNaN(Number(val))) {
                            setEditFlowResultIdError('Only SonarQube scan result IDs are allowed.');
                          } else if (val && String(val).toLowerCase().includes('zap')) {
                            setEditFlowResultIdError('ZAP scan result IDs are not allowed.');
                          } else {
                            setEditFlowResultIdError(null);
                          }
                        }}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                        placeholder="Enter scan result ID"
                        min={0}
                      />
                      {editFlowResultIdError && (
                        <div className="text-red-600 text-xs mt-1">{editFlowResultIdError}</div>
                      )}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">API Endpoints</label>
                    <div className="space-y-2">
                        {editingFlowData.apiEndpoints && editingFlowData.apiEndpoints.map((endpoint, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={endpoint}
                                    onChange={e => handleEditEndpointChange(idx, e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition"
                                    placeholder="/api/v1/example"
                                />
                                {editingFlowData.apiEndpoints && editingFlowData.apiEndpoints.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEditEndpointField(idx)}
                                        className="text-xs text-red-600 hover:underline px-2 py-1 rounded focus:outline-none"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addEditEndpointField}
                        className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium focus:outline-none"
                    >
                        + Add Endpoint
                    </button>
                </div>
            </div>
        </Modal>
      )}

      {/* Success Modal for Edit Flow */}
      <Modal
        isOpen={showEditSuccessModal}
        onClose={() => setShowEditSuccessModal(false)}
        title="Success"
        showConfirmButton={true}
        confirmButtonText="OK"
        onConfirm={() => setShowEditSuccessModal(false)}
        showCancelButton={false}
      >
        <p>Flow successfully changed!</p>
      </Modal>

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
          setAnalyzeLoading(false);
          setShowCompletionMessage(false); // Reset completion message on close
        }}
        title="Business Flow Analysis Result"
        showConfirmButton={false}
        cancelButtonText="Close"
        maxWidthClass="max-w-2xl"
      >
        {analyzeLoading ? (
          <div className="py-8 px-4">
            <div className="h-4 bg-indigo-500 rounded w-full animate-pulse"></div>
            <p className="text-center mt-3 text-sm text-gray-700">Analyzing flow, please wait...</p>
          </div>
        ) : analyzeError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-semibold text-red-700">Analysis Failed</h3>
            <p className="text-sm text-red-600 mt-1">{analyzeError}</p>
          </div>
        ) : analyzeResult && analyzeResult.data ? (
          <div className="space-y-4"> {/* Wrapper for results and completion message */}
            {showCompletionMessage && (
              <div className="p-3 bg-green-100 border border-green-300 rounded-md text-center">
                <p className="text-md font-semibold text-green-700">Analysis completed successfully!</p>
              </div>
            )}
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
          <div className="text-center py-6 text-gray-500">
            No analysis result.
          </div>
        )}
      </Modal>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center my-4">
        <div>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-gray-200 mr-2 disabled:opacity-50">Prev</button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
          <span className="ml-4 text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Total: {totalElements}</span>
        </div>
      </div>
    </div>
  );
};

export default FlowAnalyzer;

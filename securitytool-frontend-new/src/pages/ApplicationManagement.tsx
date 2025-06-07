import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { fetchApplications, createApplication, updateApplication, deleteApplication, searchApplications, PaginatedApplications } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationRequestDTO, ApplicationResponseDTO } from '../types/application';

const ApplicationManagement: React.FC = () => {
  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const qc = useQueryClient();
  // Fetch paginated applications
  const { data: paginatedApps, isLoading, isError, error } = useQuery<PaginatedApplications, Error>({
    queryKey: ['applications', page, pageSize],
    queryFn: () => fetchApplications(page, pageSize),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (paginatedApps) {
      setTotalPages(paginatedApps.totalPages);
      setTotalElements(paginatedApps.totalElement);
    }
  }, [paginatedApps]);
  const applications: ApplicationResponseDTO[] = paginatedApps && Array.isArray((paginatedApps as any).content)
    ? (paginatedApps as any).content.map((app: any) => ({ ...app, appId: Number(app.id) }))
    : [];

  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Add state for error messages
  const [addNameError, setAddNameError] = useState('');
  const [addUrlError, setAddUrlError] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editUrlError, setEditUrlError] = useState('');
  const createMut = useMutation<ApplicationResponseDTO, Error, ApplicationRequestDTO>({
    mutationFn: createApplication,
    onSuccess: (createdApp) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setIsAddModalOpen(false);
      setNewAppName('');
      setNewAppUrl('');
      setNewAuthInfo('');
      setNewDescription('');
      setNewTechStack('');
      setAddModalError(null);
      setAddNameError('');
      setAddUrlError('');
    },
    onError: (err: any) => {
      // Reset previous errors
      setAddNameError('');
      setAddUrlError('');
      setAddModalError(null);
      
      // Try different ways to extract the error message
      let errorMessage = 'Failed to create application.';
      
      // Check if the error response has data with a message
      if (err?.response?.data) {
        const data = err.response.data;
        
        // Try multiple possible message fields
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for duplicate name errors with various patterns
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('already exists') || 
          lowerMsg.includes('duplicate') || 
          lowerMsg.includes('name already') ||
          lowerMsg.includes('application name') ||
          (err?.response?.status === 409)) { // 409 Conflict status typically indicates duplicate resource
        setAddNameError(errorMessage);
      } else {
        setAddModalError(errorMessage);
      }
    }
  });
  const updateMut = useMutation<ApplicationResponseDTO, Error, { id: number; payload: ApplicationRequestDTO }>({
    mutationFn: ({ id, payload }) => updateApplication(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setIsEditModalOpen(false);
      setEditingApp(null);
      setEditModalError(null);
      setEditNameError('');
      setEditUrlError('');
    },
    onError: (err: any) => {
      console.log('Full error object:', err);
      console.log('Error response:', err?.response);
      console.log('Error response data:', err?.response?.data);
      
      // Reset previous errors
      setEditNameError('');
      setEditUrlError('');
      setEditModalError(null);
      
      // Try different ways to extract the error message
      let errorMessage = 'Failed to update application.';
      
      // Check if the error response has data with a message
      if (err?.response?.data) {
        const data = err.response.data;
        
        // Try multiple possible message fields
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.details) {
          errorMessage = data.details;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('Extracted error message:', errorMessage);
      
      // Check for duplicate name errors with various patterns
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('already exists') || 
          lowerMsg.includes('duplicate') || 
          lowerMsg.includes('name already') ||
          lowerMsg.includes('application name') ||
          (err?.response?.status === 409)) { // 409 Conflict status typically indicates duplicate resource
        setEditNameError(errorMessage);
      } else {
        setEditModalError(errorMessage);
      }
    }
  });

  const deleteMut: UseMutationResult<void, Error, number, unknown> = useMutation<void, Error, number>({
    mutationFn: deleteApplication,
    onMutate: (appId) => {
      // Optimistically update the UI or set loading states if needed
      // For instance, you might want to show a spinner on the specific item being deleted
      // setAppErrors(prev => ({ ...prev, [appId]: null })); // Example: clearing previous error for this app
    },
    onSuccess: (data, appId) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      // Optionally, clear any specific app errors if they were being managed
      // setAppErrors(prev => ({ ...prev, [appId]: null })); 
    },
    onError: (err, appId) => {
      // Here you could set an error message specific to the app that failed to delete
      // For example, if you had a way to display errors per item:
      // setAppErrors(prev => ({ ...prev, [appId]: err.message || 'Failed to delete application.' }));
      // For now, we'll rely on a general error message or toast notification if implemented elsewhere.
      console.error(`Failed to delete application ${appId}:`, err);
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');
  const [newAuthInfo, setNewAuthInfo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTechStack, setNewTechStack] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationResponseDTO | null>(null);
  const [editAppName, setEditAppName] = useState('');
  const [editAppUrl, setEditAppUrl] = useState('');
  const [editAuthInfo, setEditAuthInfo] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTechStack, setEditTechStack] = useState('');

  // State for delete confirmation modal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [appToDeleteId, setAppToDeleteId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ApplicationResponseDTO[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const maskAuthInfo = (authInfo: string | undefined | null): string => {
    if (!authInfo || authInfo.length <= 3) {
      return authInfo || 'N/A';
    }
    return `${authInfo.substring(0, 3)}****`;
  };
  const handleAdd = () => {
    setNewAppName('');
    setNewAppUrl('');
    setNewAuthInfo('');
    setNewDescription('');
    setNewTechStack('');
    
    // Clear all previous errors when opening add modal
    setAddModalError(null);
    setAddNameError('');
    setAddUrlError('');
    
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    setAddModalError(null);
    setAddNameError('');
    setAddUrlError('');
    let hasError = false;
    if (!newAppName.trim()) {
      setAddNameError('Application Name is required.');
      hasError = true;
    }
    if (!newAppUrl.trim()) {
      setAddUrlError('Application URL is required.');
      hasError = true;
    }
    if (newAppUrl.endsWith('/')) {
      setAddUrlError('Application URL should not end with a trailing slash (/).');
      hasError = true;
    }
    if (hasError) return;
    const payload: ApplicationRequestDTO = {
      appName: newAppName,
      appUrl: newAppUrl,
      basePath: undefined,
      authInfo: newAuthInfo,
      description: newDescription,
      techStack: newTechStack,
    };
    
    createMut.mutate(payload);
    // No longer closing modal or resetting fields here, moved to onSuccess of createMut
  };
  const handleEdit = (app: ApplicationResponseDTO) => {
    console.log('Editing app (raw from list):', app);
    const actualId = (app as any).id;
    console.log('Actual ID read from app.id:', actualId);

    if (actualId === undefined || actualId === null || isNaN(Number(actualId))) {
      console.error('Cannot edit application: ID is missing or invalid from the app object.', app);
      // Optionally set a page-level error or a specific error for this app item if needed
      // setAppErrors(prev => ({ ...prev, [app.appId]: 'Cannot edit: Application ID is invalid.'}));
      return;
    }

    const conformantAppForEditing: ApplicationResponseDTO = {
      ...app,
      appId: Number(actualId),
    };

    setEditingApp(conformantAppForEditing);
    setEditAppName(conformantAppForEditing.appName);
    setEditAppUrl(conformantAppForEditing.appUrl);
    setEditAuthInfo(conformantAppForEditing.authInfo || '');
    setEditDescription(conformantAppForEditing.description || '');
    setEditTechStack(conformantAppForEditing.techStack || '');
    
    // Clear all previous errors when opening edit modal
    setEditModalError(null);
    setEditNameError('');
    setEditUrlError('');
    
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    setEditModalError(null);
    setEditNameError('');
    setEditUrlError('');
    let hasError = false;
    if (!editAppName.trim()) {
      setEditNameError('Application Name is required.');
      hasError = true;
    }
    if (!editAppUrl.trim()) {
      setEditUrlError('Application URL is required.');
      hasError = true;
    }
    if (editAppUrl.endsWith('/')) {
      setEditUrlError('Application URL should not end with a trailing slash (/).');
      hasError = true;
    }
    if (!editingApp || hasError) return;
    const payload: ApplicationRequestDTO = {
      appName: editAppName,
      appUrl: editAppUrl,
      basePath: undefined,
      authInfo: editAuthInfo,
      description: editDescription,
      techStack: editTechStack,
    };

    console.log('Submitting edit with payload:', payload);
    updateMut.mutate({ id: editingApp.appId, payload });
    // No longer closing modal or resetting fields here, moved to onSuccess of updateMut
  };

  // Opens the delete confirmation modal
  const handleDeleteApp = (appId: number) => {
    setAppToDeleteId(appId);
    setIsConfirmDeleteModalOpen(true);
  };

  // Performs the actual deletion
  const confirmDeleteApp = () => {
    if (appToDeleteId !== null) {
      deleteMut.mutate(appToDeleteId);
    }
    setIsConfirmDeleteModalOpen(false);
    setAppToDeleteId(null);
  };

  // Cancels the deletion and closes the modal
  const cancelDeleteApp = () => {
    setIsConfirmDeleteModalOpen(false);
    setAppToDeleteId(null);
  };

  // Search handler for paginated API
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
      // Use searchApplications (not paginated, returns all matches)
      const results = await searchApplications(searchTerm.trim());
      setSearchResults(results.map(app => ({ ...app, appId: app.appId ?? Number((app as any).id) })));
    } catch (err: any) {
      setSearchError(err.message || 'Search failed.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  if (isLoading) return <Loading />;
  if (isError && !applications) return <ErrorDisplay message={error?.message || 'Failed to fetch applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-gray-800 mr-4">Application Management</h1>
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="flex rounded-full shadow-sm bg-white border border-gray-300 items-center">
              {/* Search icon on the left */}
              <span className="flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
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
                {/* Search icon in the button */}
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </button>
            </div>
            {searchTerm && (
              <button type="button" className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => { setSearchTerm(''); setSearchResults(null); setSearchError(null); }}>Clear</button>
            )}
          </form>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-base font-semibold flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Application
        </button>
      </div>
      {searchError && <div className="mb-2"><ErrorDisplay message={searchError} /></div>}

      {(searchResults !== null ? searchResults : applications) && (searchResults !== null ? searchResults : applications)!.length > 0 ? (
        <div className="space-y-4">
          {(searchResults !== null ? searchResults : applications)!.map(app => (
            <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
              <div className="p-6 flex justify-between items-center">
                <div>
                  {/* Combine name and URL */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {app.appName}:&nbsp;
                    <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                      {app.appUrl}
                    </a>
                  </h2>
                  <p className="text-base font-semibold text-indigo-700 bg-indigo-50 rounded px-2 py-1 mb-2 inline-block shadow-sm">
                    Created: {new Date(app.createdAt).toLocaleString()} &nbsp;|&nbsp; Updated: {new Date(app.updatedAt).toLocaleString()}
                  </p>
                  {/* Colorful and prettier info, each on its own line */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded px-3 py-1 w-fit">
                      <span className="font-semibold text-yellow-700 mr-1">SonarQube Auth:</span>
                      <span className="bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 font-mono tracking-wider">{maskAuthInfo(app.authInfo)}</span>
                    </div>
                    <div className="inline-flex items-center bg-green-50 border border-green-200 rounded px-3 py-1 w-fit">
                      <span className="font-semibold text-green-700 mr-1">Description:</span>
                      <span className="text-green-900">{app.description ? app.description : <span className="italic text-gray-400">N/A</span>}</span>
                    </div>
                    <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded px-3 py-1 w-fit">
                      <span className="font-semibold text-blue-700 mr-1">Tech Stack:</span>
                      <span className="text-blue-900">{app.techStack ? app.techStack : <span className="italic text-gray-400">N/A</span>}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(app)}
                    type="button"
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteApp(app.appId)} // Changed to open confirmation modal
                    disabled={deleteMut.isPending && deleteMut.variables === app.appId}
                    className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center 
                                ${deleteMut.isPending && deleteMut.variables === app.appId ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`} // Removed w-full
                  >
                    {deleteMut.isPending && deleteMut.variables === app.appId ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No applications found. Click "Add New Application" to get started.</p>
      )}

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

      {/* Add Application Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onConfirm={handleAddSubmit} 
        title="Add New Application"
        confirmButtonText="Add Application"
        confirmButtonPosition="left"
      >
        <div className="space-y-3">          <div>
            <label htmlFor="newAppName" className="block text-sm font-medium text-gray-700">
              Application Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="newAppName" value={newAppName} onChange={e => { 
              setNewAppName(e.target.value); 
              setAddNameError(''); 
              setAddModalError(null);
            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter application name" required />
            {addNameError && <p className="text-xs text-red-500 mt-1">{addNameError}</p>}
          </div>
          <div>
            <label htmlFor="newAppUrl" className="block text-sm font-medium text-gray-700">
              Application URL <span className="text-red-500">*</span>
            </label>
            <input type="text" id="newAppUrl" value={newAppUrl} onChange={e => { 
              setNewAppUrl(e.target.value); 
              setAddUrlError(''); 
              setAddModalError(null);
            }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., http://localhost:3000" required />
            {addUrlError && <p className="text-xs text-red-500 mt-1">{addUrlError}</p>}
          </div>
          <div>
            <label htmlFor="newAuthInfo" className="block text-sm font-medium text-gray-700">SonarQube Authentication Info</label>
            <textarea id="newAuthInfo" value={newAuthInfo} onChange={e => setNewAuthInfo(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Sonarqube authentication key"></textarea>
          </div>
          <div>
            <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="newDescription" value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Describe the application"></textarea>
          </div>
          <div>
            <label htmlFor="newTechStack" className="block text-sm font-medium text-gray-700">Tech Stack</label>
            <input type="text" id="newTechStack" value={newTechStack} onChange={e => setNewTechStack(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., React, Node.js, MongoDB" />
          </div>
        </div>
        {addModalError && <ErrorDisplay message={addModalError} />}
      </Modal>

      {/* Edit Application Modal */}
      {editingApp && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          title="Edit Application"
          confirmButtonPosition="left"
          onConfirm={handleEditSubmit}
          isConfirmDisabled={updateMut.isPending}
          confirmButtonText={updateMut.isPending ? 'Saving...' : 'Save Changes'}
        >
          {editingApp && (
            <div>              <div className="mb-4">
                <label htmlFor="editAppName" className="block text-sm font-medium text-gray-700">
                  Application Name <span className="text-red-500">*</span>
                </label>
                <input type="text" id="editAppName" value={editAppName} onChange={e => { 
                  setEditAppName(e.target.value); 
                  setEditNameError(''); 
                  setEditModalError(null);
                }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                {editNameError && <p className="text-xs text-red-500 mt-1">{editNameError}</p>}
              </div>              <div className="mb-4">
                <label htmlFor="editAppUrl" className="block text-sm font-medium text-gray-700">
                  Application URL <span className="text-red-500">*</span>
                </label>
                <input type="text" id="editAppUrl" value={editAppUrl} onChange={e => { 
                  setEditAppUrl(e.target.value); 
                  setEditUrlError(''); 
                  setEditModalError(null);
                }} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., http://localhost:3000" required />
                {editUrlError && <p className="text-xs text-red-500 mt-1">{editUrlError}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="editAuthInfo" className="block text-sm font-medium text-gray-700">SonarQube Authentication Info</label>
                <textarea id="editAuthInfo" value={editAuthInfo} onChange={e => setEditAuthInfo(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Sonarqube authentication key"></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="editDescription" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Describe the application"></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="editTechStack" className="block text-sm font-medium text-gray-700">Tech Stack</label>
                <input type="text" id="editTechStack" value={editTechStack} onChange={e => setEditTechStack(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., React, Node.js, MongoDB" />
              </div>
            </div>
          )}
          {editModalError && !editNameError && <ErrorDisplay message={editModalError} />}
        </Modal>
      )}

      {/* Confirm Delete Application Modal */}
      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={cancelDeleteApp}
        onConfirm={confirmDeleteApp}
        title="Confirm Delete Application"
        confirmButtonText="Delete"
        confirmButtonPosition="left"
      >
        <p className="text-gray-700">Are you sure you want to delete this application? This action cannot be undone.</p>
        {deleteMut.isError && appToDeleteId && (
            <ErrorDisplay message={(deleteMut.error as Error)?.message || `Failed to delete application ID: ${appToDeleteId}.`} />
        )}
      </Modal>
    </div>
  );
};
export default ApplicationManagement;
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationRequestDTO, ApplicationResponseDTO } from '../types/application';

const ApplicationManagement: React.FC = () => {
  const qc = useQueryClient();
  const { data: applications, isLoading, isError, error } = useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    select: (fetchedData: any[]) => {
      if (!fetchedData) return [];
      return fetchedData.map(app => ({
        ...app,
        appId: Number((app as any).id), // Ensure mapping from id to appId as a number
      }));
    }
  });

  const [appErrors, setAppErrors] = useState<{ [key: number]: string | null }>({});
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  const createMut = useMutation<ApplicationResponseDTO, Error, ApplicationRequestDTO>({
    mutationFn: createApplication,
    onSuccess: (createdApp) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setIsAddModalOpen(false);
      setNewAppName('');
      setNewAppUrl('');
      setNewAuthInfo('');
      setAddModalError(null);
    },
    onError: (err) => {
      setAddModalError(err.message || 'Failed to create application.');
    }
  });

  const updateMut = useMutation<ApplicationResponseDTO, Error, { id: number; payload: ApplicationRequestDTO }>({
    mutationFn: ({ id, payload }) => updateApplication(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setIsEditModalOpen(false);
      setEditingApp(null);
      setEditModalError(null);
    },
    onError: (err) => {
      setEditModalError(err.message || 'Failed to update application.');
    }
  });

  const deleteMut: UseMutationResult<void, Error, number, unknown> = useMutation<void, Error, number>({
    mutationFn: deleteApplication,
    onMutate: (appId) => {
      setAppErrors(prev => ({ ...prev, [appId]: null }));
    },
    onSuccess: (data, appId) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setAppErrors(prev => ({ ...prev, [appId]: null }));
    },
    onError: (err, appId) => {
      setAppErrors(prev => ({ ...prev, [appId]: err.message || 'Failed to delete application.' }));
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppUrl, setNewAppUrl] = useState('');
  const [newAuthInfo, setNewAuthInfo] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationResponseDTO | null>(null);
  const [editAppName, setEditAppName] = useState('');
  const [editAppUrl, setEditAppUrl] = useState('');
  const [editAuthInfo, setEditAuthInfo] = useState('');

  // State for delete confirmation modal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [appToDeleteId, setAppToDeleteId] = useState<number | null>(null);

  const handleAdd = () => {
    setNewAppName('');
    setNewAppUrl('');
    setNewAuthInfo('');
    setAddModalError(null); // Clear previous errors
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    setAddModalError(null); // Clear previous error before new attempt
    if (newAppUrl.endsWith('/')) {
      setAddModalError('Application URL should not end with a trailing slash (/).');
      return;
    }
    if (!newAppName.trim()) {
      setAddModalError('Application Name cannot be empty.');
      return;
    }
    if (!newAppUrl.trim()) {
      setAddModalError('Application URL cannot be empty.');
      return;
    }

    if (newAppName && newAppUrl) {
      const payload: ApplicationRequestDTO = {
        appName: newAppName,
        appUrl: newAppUrl,
      };
      
      if (newAuthInfo) {
        payload.authInfo = newAuthInfo;
      }
      
      createMut.mutate(payload);
      // No longer closing modal or resetting fields here, moved to onSuccess of createMut
    }
  };

  const handleEdit = (app: ApplicationResponseDTO) => {
    console.log('Editing app (raw from list):', app);
    const actualId = (app as any).id;
    console.log('Actual ID read from app.id:', actualId);

    if (actualId === undefined || actualId === null || isNaN(Number(actualId))) {
      console.error('Cannot edit application: ID is missing or invalid from the app object.', app);
      // Optionally set a page-level error or a specific error for this app item if needed
      setAppErrors(prev => ({ ...prev, [app.appId]: 'Cannot edit: Application ID is invalid.'}));
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
    setEditModalError(null); // Clear previous errors
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    setEditModalError(null); // Clear previous error
    if (editingApp) {
      if (!editAppName.trim()) {
        setEditModalError("Application Name cannot be empty.");
        return;
      }
      if (!editAppUrl.trim()) {
        setEditModalError("Application URL cannot be empty.");
        return;
      }
      if (editAppUrl.endsWith('/')) {
        setEditModalError('Application URL should not end with a trailing slash (/).');
        return;
      }

      const payload: ApplicationRequestDTO = {
        appName: editAppName,
        appUrl: editAppUrl,
        authInfo: editAuthInfo, 
      };

      console.log('Submitting edit with payload:', payload);
      updateMut.mutate({ id: editingApp.appId, payload });
      // No longer closing modal or resetting fields here, moved to onSuccess of updateMut
    } else {
      console.error('No application selected for editing.');
      setEditModalError('No application selected for editing. Please close and try again.');
    }
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

  if (isLoading) return <Loading />;
  if (isError && !applications) return <ErrorDisplay message={error?.message || 'Failed to fetch applications'} />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Application Management</h1>
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

      {isError && applications && <div className="mb-4"><ErrorDisplay message={error?.message || 'There was an issue fetching applications, but showing cached data.'} /></div>}
      
      {applications && applications.length > 0 ? (
        <div className="space-y-4"> {/* Changed from grid to vertical list */}
          {applications.map(app => (
            <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
              <div className="p-6 flex justify-between items-center"> {/* MODIFIED for horizontal layout */}
                <div> {/* Wrapper for app details */}
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={app.appName}>{app.appName}</h2>
                  <p className="text-sm text-gray-500 mb-1 truncate">URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a></p>
                  
                  {appErrors[app.appId] && (
                    <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                      <p>Error: {appErrors[app.appId]}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2"> {/* MODIFIED for horizontal buttons */}
                  <button 
                    onClick={() => handleEdit(app)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center" // Removed w-full
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

      {/* Add Application Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onConfirm={handleAddSubmit} 
        title="Add New Application"
        confirmButtonText="Add Application"
        confirmButtonPosition="left"
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="newAppName" className="block text-sm font-medium text-gray-700">Application Name</label>
            <input type="text" id="newAppName" value={newAppName} onChange={e => setNewAppName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="newAppUrl" className="block text-sm font-medium text-gray-700">Application URL</label>
            <input type="text" id="newAppUrl" value={newAppUrl} onChange={e => setNewAppUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., http://localhost:3000" required />
          </div>
          <div>
            <label htmlFor="newAuthInfo" className="block text-sm font-medium text-gray-700">Authentication Info (Optional)</label>
            <textarea id="newAuthInfo" value={newAuthInfo} onChange={e => setNewAuthInfo(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., API Key, Token, etc."></textarea>
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
          {editingApp && ( // Add this check to ensure editingApp is not null
            <div>
              <div className="mb-4">
                <label htmlFor="editAppName" className="block text-sm font-medium text-gray-700">Application Name</label>
                <input type="text" id="editAppName" value={editAppName} onChange={e => setEditAppName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
              </div>
              <div className="mb-4">
                <label htmlFor="editAppUrl" className="block text-sm font-medium text-gray-700">Application URL</label>
                <input type="text" id="editAppUrl" value={editAppUrl} onChange={e => setEditAppUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., http://localhost:3000" required />
              </div>
              <div className="mb-4">
                <label htmlFor="editAuthInfo" className="block text-sm font-medium text-gray-700">Authentication Info (Optional)</label>
                <textarea id="editAuthInfo" value={editAuthInfo} onChange={e => setEditAuthInfo(e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., API Key, Token, etc."></textarea>
              </div>
            </div>
          )}
          {editModalError && <ErrorDisplay message={editModalError} />}
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
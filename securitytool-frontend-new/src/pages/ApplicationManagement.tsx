import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '../api/applicationApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import { ApplicationRequestDTO, ApplicationResponseDTO } from '../types/application';

const ApplicationManagement: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
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
      setNewBasePath('/api');
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
  const [newBasePath, setNewBasePath] = useState('/api');
  const [newAuthInfo, setNewAuthInfo] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationResponseDTO | null>(null);
  const [editAppName, setEditAppName] = useState('');
  const [editAppUrl, setEditAppUrl] = useState('');
  const [editBasePath, setEditBasePath] = useState('');
  const [editAuthInfo, setEditAuthInfo] = useState('');

  const handleAdd = () => {
    setNewAppName('');
    setNewAppUrl('');
    setNewBasePath('');
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
        basePath: newBasePath,
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
    setEditBasePath(conformantAppForEditing.basePath || '');
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
        basePath: editBasePath, 
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

  if (isLoading) return <Loading />;
  if (isError && !data) return <ErrorDisplay message={error?.message || 'Failed to fetch applications'} />;

  return (
      <div>
        <div className="flex items-center mb-4">
          <h1 className="text-2xl mr-4">Applications</h1>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded">Add Application</button>
        </div>
        {isError && data && <ErrorDisplay message={error?.message || 'There was an issue fetching applications, but showing cached data.'} />}
        
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleAddSubmit}
          title="Add New Application"
        >
          <div className="mb-4">
            <label htmlFor="appName" className="block text-sm font-medium text-gray-700">Application Name</label>
            <input
              type="text"
              id="appName"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="book store" 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="appUrl" className="block text-sm font-medium text-gray-700">Application URL</label>
            <input
              type="text"
              id="appUrl"
              value={newAppUrl}
              onChange={(e) => setNewAppUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="http://localhost:5173" 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="basePath" className="block text-sm font-medium text-gray-700">Base Path</label>
            <input
              type="text"
              id="basePath"
              value={newBasePath}
              onChange={(e) => setNewBasePath(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="/books" 
            />
          </div>
          <div>
            <label htmlFor="authInfo" className="block text-sm font-medium text-gray-700">Authentication Info</label>
            <input
              type="text"
              id="authInfo"
              value={newAuthInfo}
              onChange={(e) => setNewAuthInfo(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Auth Info (Optional)"
            />
          </div>
          {addModalError && <div className="mt-4"><ErrorDisplay message={addModalError} /></div>}
        </Modal>

        {editingApp && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onConfirm={handleEditSubmit}
            title={`Edit ${editingApp.appName}`}
          >
            <div className="mb-4">
              <label htmlFor="editAppId" className="block text-sm font-medium text-gray-700">Application ID</label>
              <input
                type="text"
                id="editAppId"
                value={editingApp.appId}
                readOnly
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="editAppName" className="block text-sm font-medium text-gray-700">Application Name</label>
              <input
                type="text"
                id="editAppName"
                value={editAppName}
                onChange={(e) => setEditAppName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="editAppUrl" className="block text-sm font-medium text-gray-700">Application URL</label>
              <input
                type="text"
                id="editAppUrl"
                value={editAppUrl}
                onChange={(e) => setEditAppUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="editBasePath" className="block text-sm font-medium text-gray-700">Base Path</label>
              <input
                type="text"
                id="editBasePath"
                value={editBasePath}
                onChange={(e) => setEditBasePath(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="editAuthInfo" className="block text-sm font-medium text-gray-700">Authentication Info</label>
              <input
                type="text"
                id="editAuthInfo"
                value={editAuthInfo}
                onChange={(e) => setEditAuthInfo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {editModalError && <div className="mt-4"><ErrorDisplay message={editModalError} /></div>}
          </Modal>
        )}

        <ul className="space-y-2 mt-4">
          {data?.map((app, index) => {
            if (app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn(
                `Application at index ${index} has an invalid appId. Skipping render. ` +
                `appId value: ${app.appId}, type: ${typeof app.appId}. Raw app object:`, app
              );
              return (
                <li key={`invalid-app-${index}`} className="p-4 bg-red-100 rounded shadow">
                  <p className="text-red-700 font-semibold">Invalid application data at index {index}.</p>
                  <p className="text-xs text-red-600">App ID is missing or invalid. Please check console for details.</p>
                </li>
              );
            }

            const isDeleting = deleteMut.isPending && deleteMut.variables === app.appId;

            return (
              <li key={app.appId} className="p-4 bg-white rounded shadow flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <div>App Name: <span className="font-bold">{app.appName}</span></div>
                    <div className="text-gray-600">
                      App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                    </div>
                    <div className="text-gray-600">
                      Auth Info: {app.authInfo ? app.authInfo : 'Not set'}
                    </div>
                  </div>
                  <div className="space-x-2 flex-shrink-0">
                    <button onClick={() => handleEdit(app)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                    <button 
                      onClick={() => {
                        console.log(`Attempting to delete application with appId: ${app.appId} (type: ${typeof app.appId})`);
                        if (app.appId === undefined || app.appId === null || isNaN(app.appId)) {
                          console.error('Critical: Invalid appId before delete mutate call:', app.appId, app);
                          setAppErrors(prev => ({ ...prev, [app.appId]: 'Error: Cannot delete due to invalid Application ID.' }));
                          return;
                        }
                        deleteMut.mutate(app.appId);
                      }} 
                      disabled={isDeleting}
                      className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                {appErrors[app.appId] && (
                  <div className="mt-2 w-full">
                    <ErrorDisplay message={appErrors[app.appId]!} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
  );
};
export default ApplicationManagement;
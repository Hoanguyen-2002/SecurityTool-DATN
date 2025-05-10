import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '../api/applicationApi';
import Loading from '../components/Loading';
import Error from '../components/Error';
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
  const createMut = useMutation<ApplicationResponseDTO, Error, ApplicationRequestDTO>({
    mutationFn: createApplication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] })
  });
  const updateMut = useMutation<ApplicationResponseDTO, Error, { id: number; payload: ApplicationRequestDTO }>({
    mutationFn: ({ id, payload }) => updateApplication(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] })
  });
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteApplication,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] })
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
    // Reset fields to ensure a clean form when adding a new application
    setNewAppName('');
    setNewAppUrl('');
    setNewBasePath(''); // Changed from '/api' to empty for a truly blank field
    setNewAuthInfo('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    // Validate App URL: should not end with a slash
    if (newAppUrl.endsWith('/')) {
      alert('Application URL should not end with a trailing slash (/).');
      return; // Prevent submission
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
      setIsAddModalOpen(false);
      setNewAppName('');
      setNewAppUrl('');
      setNewBasePath('/api');
      setNewAuthInfo('');
    }
  };

  const handleEdit = (app: ApplicationResponseDTO) => {
    console.log('Editing app (raw from list):', app);
    const actualId = (app as any).id;
    console.log('Actual ID read from app.id:', actualId);

    if (actualId === undefined || actualId === null || isNaN(Number(actualId))) {
      console.error('Cannot edit application: ID is missing or invalid from the app object.', app);
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
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (editingApp) {
      // Validate required fields
      if (!editAppName.trim()) {
        alert("Application Name cannot be empty.");
        return;
      }
      if (!editAppUrl.trim()) {
        alert("Application URL cannot be empty.");
        return;
      }
      // Validate App URL format: should not end with a slash
      if (editAppUrl.endsWith('/')) {
        alert('Application URL should not end with a trailing slash (/).');
        return;
      }

      const payload: ApplicationRequestDTO = {
        appName: editAppName,
        appUrl: editAppUrl,
        basePath: editBasePath, // Send the current value from the form (can be "")
        authInfo: editAuthInfo, // Send the current value from the form (can be "")
      };

      console.log('Submitting edit with payload:', payload); // Log payload for debugging
      updateMut.mutate({ id: editingApp.appId, payload });
      setIsEditModalOpen(false);
      setEditingApp(null);
    } else {
      console.error('No application selected for editing.');
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Error message={(error as Error).message} />;

  return (
      <div>
        <div className="flex items-center mb-4">
          <h1 className="text-2xl mr-4">Applications</h1>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded">Add Application</button>
        </div>
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
              placeholder="book store" // MODIFIED placeholder
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
              placeholder="http://localhost:5173" // MODIFIED placeholder
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
              placeholder="/books" // MODIFIED placeholder
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
          </Modal>
        )}

        <ul className="space-y-2">
          {data?.map((app, index) => {
            if (app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn(
                `Application at index ${index} has an invalid appId. Skipping render. ` +
                `appId value: ${app.appId}, type: ${typeof app.appId}. Raw app object:`, app
              );
              return null;
            }

            return (
              <li key={app.appId} className="p-4 bg-white rounded shadow flex justify-between">
                <div>
                  {/* MODIFIED to add "App Name: " prefix, keeping appName value bold */}
                  <div>App Name: <span className="font-bold">{app.appName}</span></div>
                  {/* MODIFIED to add "App URL: " prefix */}
                  <div className="text-gray-600">
                    App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                  </div>
                  <div className="text-gray-600">
                    Auth Info: {app.authInfo ? app.authInfo : 'Not set'}
                  </div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleEdit(app)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                  <button 
                    onClick={() => {
                      console.log(`Attempting to delete application with appId: ${app.appId} (type: ${typeof app.appId})`);
                      if (app.appId === undefined || app.appId === null || isNaN(app.appId)) {
                        alert('Error: Cannot delete due to invalid Application ID. Please refresh.');
                        console.error('Critical: Invalid appId before delete mutate call:', app.appId, app);
                        return;
                      }
                      deleteMut.mutate(app.appId);
                    }} 
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
  );
};
export default ApplicationManagement;
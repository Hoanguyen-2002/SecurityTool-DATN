import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApplications } from '../api/applicationApi';
import { createModule } from '../api/moduleApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Modal from '../components/Modal';
import Layout from '../components/Layout';
import { ApplicationResponseDTO } from '../types/application';
import { ModuleRequestDTO } from '../types/module';

const ModuleManagement: React.FC = () => {
  const qc = useQueryClient();
  const { data: applications, isLoading, isError, error } = useQuery<ApplicationResponseDTO[], Error, ApplicationResponseDTO[]>({
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
  const createMut = useMutation({ mutationFn: createModule, onSuccess: () => qc.invalidateQueries({ queryKey: ['modules'] }) });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [newModuleName, setNewModuleName] = useState('');
  const [newRepoPath, setNewRepoPath] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleOpenAddModal = (appId: number) => {
    setSelectedAppId(appId);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    if (selectedAppId && newModuleName && newRepoPath) {
      createMut.mutate({
        moduleName: newModuleName,
        repositoryPath: newRepoPath,
        description: newDescription,
        appId: selectedAppId,
        endpointIds: [],
      });
      setIsAddModalOpen(false);
      setNewModuleName('');
      setNewRepoPath('');
      setNewDescription('');
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as Error).message} />;

  return (
      <div>
        <h1 className="text-2xl mb-4">Modules</h1>
        <ul className="space-y-4">
          {applications?.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null;
            }
            return (
              <li key={app.appId} className="p-4 bg-white rounded shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <div>App Name: <span className="font-bold text-lg">{app.appName}</span></div>
                    <div className="text-gray-600">
                      App URL: {app.appUrl}{app.basePath && app.basePath !== '/' ? app.basePath : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal(app.appId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Add Module
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {createMut.isError && <ErrorDisplay message={createMut.error.message} />}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleAddSubmit}
          title="Add New Module"
        >
          <div className="mb-4">
            <label htmlFor="moduleName" className="block text-sm font-medium text-gray-700">Module Name</label>
            <input
              type="text"
              id="moduleName"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Module Name"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="repoPath" className="block text-sm font-medium text-gray-700">Repository Path</label>
            <input
              type="text"
              id="repoPath"
              value={newRepoPath}
              onChange={(e) => setNewRepoPath(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="/path/to/repository"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Module description (optional)"
            />
          </div>
        </Modal>
      </div>
  );
};

export default ModuleManagement;
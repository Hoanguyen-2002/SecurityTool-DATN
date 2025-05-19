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
  const createMut = useMutation<ModuleRequestDTO, Error, ModuleRequestDTO>({
    mutationFn: createModule, 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules'] });
      setIsAddModalOpen(false);
      setNewModuleName('');
      setNewRepoPath('');
      setNewDescription('');
      setSelectedAppId(null);
    } 
  });

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Module Management</h1>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map(app => {
            if (!app || app.appId === undefined || app.appId === null || isNaN(app.appId)) {
              console.warn('Skipping rendering application due to missing or invalid appId:', app);
              return null;
            }
            return (
              <div key={app.appId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                <div className="p-6 flex justify-between items-center"> {/* MODIFIED for horizontal layout */}
                  <div> {/* Wrapper for app details */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={app.appName}>{app.appName}</h2>
                    <p className="text-sm text-gray-500 mb-4 truncate">
                      URL: <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">{app.appUrl}</a>
                    </p>
                  </div>
                  
                  <div className="flex space-x-2"> {/* MODIFIED for horizontal buttons */}
                    <button
                      onClick={() => handleOpenAddModal(app.appId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center" // Removed w-full
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add New Module
                    </button>
                    <button
                      // onClick={() => navigateToViewModules(app.appId)} // TODO: Implement navigation or modal for viewing modules
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center" // Removed w-full
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      View Modules
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No applications found. Please add an application first.</p>
      )}

        {createMut.isError && <div className="mt-4"><ErrorDisplay message={(createMut.error as Error)?.message || 'Failed to create module.'} /></div>}
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
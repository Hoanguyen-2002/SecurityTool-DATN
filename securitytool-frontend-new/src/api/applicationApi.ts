import instance from './axiosInstance';
import { ApplicationRequestDTO, ApplicationResponseDTO } from '../types/application';

export const fetchApplications = async (): Promise<ApplicationResponseDTO[]> => {
  const res = await instance.get('/apps');
  return res.data.data;
};

export const createApplication = async (
  payload: ApplicationRequestDTO
): Promise<ApplicationResponseDTO> => {
  const res = await instance.post('/apps', payload);
  return res.data.data;
};

export const updateApplication = async (
  appId: number,
  payload: ApplicationRequestDTO
): Promise<ApplicationResponseDTO> => {
  const res = await instance.put(`/apps/${appId}`, payload);
  return res.data.data;
};

export const deleteApplication = async (appId: number): Promise<void> => {
    await instance.delete(`/apps/${appId}`);
  };

export const searchApplications = async (appName: string): Promise<ApplicationResponseDTO[]> => {
    const res = await instance.get(`/apps/search?appName=${encodeURIComponent(appName)}`);
    return res.data.data;
  };

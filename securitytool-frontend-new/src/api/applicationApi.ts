import instance from './axiosInstance';
import { ApplicationRequestDTO, ApplicationResponseDTO } from '../types/application';

// New paginated fetchApplications
export interface PaginatedApplications {
  content: ApplicationResponseDTO[];
  pageNo: number;
  pageSize: number;
  totalElement: number;
  totalPages: number;
}

export const fetchApplications = async (
  page: number = 0,
  size: number = 5
): Promise<PaginatedApplications> => {
  const res = await instance.get(`/apps?page=${page}&size=${size}`);
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

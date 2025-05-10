import instance from './axiosInstance';
import { ModuleRequestDTO, ModuleResponseDTO } from '../types/module';

export const fetchModules = async (): Promise<ModuleResponseDTO[]> => {
  const res = await instance.get('/modules');
  return res.data.data;
};

export const createModule = async (
  payload: ModuleRequestDTO
): Promise<ModuleResponseDTO> => {
  const res = await instance.post('/modules', payload);
  return res.data.data;
};

export const updateModule = async (
  moduleId: number,
  payload: ModuleRequestDTO
): Promise<ModuleResponseDTO> => {
  const res = await instance.put(`/modules/${moduleId}`, payload);
  return res.data.data;
};

export const deleteModule = async (moduleId: number): Promise<void> => {
  await instance.delete(`/modules/${moduleId}`);
};
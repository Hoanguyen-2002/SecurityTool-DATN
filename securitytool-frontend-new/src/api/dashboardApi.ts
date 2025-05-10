import instance from './axiosInstance';
import { DashboardStatsResponseDTO } from '../types/dashboard';

/**Fetch overall system metrics*/
export const fetchDashboardStats = async (): Promise<DashboardStatsResponseDTO> => {
  const res = await instance.get('/dashboard');
  return res.data.data;
};
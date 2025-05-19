import instance from './axiosInstance';
import { DashboardStatsResponseDTO, AppDashboardStatsDTO } from '../types/dashboard';

/**Fetch overall system metrics*/
export const fetchDashboardStats = async (): Promise<DashboardStatsResponseDTO> => {
  const res = await instance.get('/dashboard');
  return res.data.data;
};

/** Fetch dashboard statistics for a specific application */
export const fetchAppDashboardStats = async (appId: number): Promise<AppDashboardStatsDTO> => {
  const res = await instance.get(`/dashboard/${appId}`); // Corrected endpoint to include appId as query param
  return res.data.data;
};
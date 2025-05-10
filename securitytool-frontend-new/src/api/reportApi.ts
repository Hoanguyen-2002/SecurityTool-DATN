import instance from './axiosInstance';
import { ReportResponseDTO } from '../types/report';

/**
 * Fetch a report by its scan result ID
 */
export const getReport = async (resultId: number): Promise<ReportResponseDTO> => {
  const res = await instance.get<{ data: ReportResponseDTO }>(`/reports/${resultId}`);
  return res.data.data;
};

/**
 * Export a report as CSV by its scan result ID
 */
export const exportReportCsv = async (resultId: number): Promise<string> => {
  const res = await instance.get<{ data: string }>(`/reports/${resultId}/csv`);
  return res.data.data;
};
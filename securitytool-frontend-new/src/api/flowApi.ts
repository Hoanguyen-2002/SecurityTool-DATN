import instance from './axiosInstance';
import { FlowAnalysisRequestDTO, ApiEndpointRequestDTO } from '../types/flow';
import { SecurityIssueResponseDTO } from '../types/report';

const BASE_PATH = '/analyze'; // corresponds to ApiConstants.ANALYZE_BASE_URL

/**
 * Analyze a business flow by its flowId and resultId
 */
export const analyzeFlow = async (
  payload: FlowAnalysisRequestDTO
): Promise<SecurityIssueResponseDTO[]> => {
  const res = await instance.post<SecurityIssueResponseDTO[]>(
    `${BASE_PATH}`,
    payload
  );
  return res.data;
};

/**
 * Analyze a business flow with specific endpoint context
 */
export const analyzeFlowWithEndpoints = async (
  payload: ApiEndpointRequestDTO
): Promise<SecurityIssueResponseDTO[]> => {
  const res = await instance.post<SecurityIssueResponseDTO[]>(
    `${BASE_PATH}/endpoints`,
    payload
  );
  return res.data;
};
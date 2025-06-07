import instance from './axiosInstance';
import { FlowAnalysisRequestDTO, ApiEndpointRequestDTO, NewFlowPayload, BusinessFlowResponseDTO, AnalyzeFlowApiResponse } from '../types/flow';
import { SecurityIssueResponseDTO } from '../types/report';

const FLOWS_BASE_PATH = '/business-flow'; // Updated base path for flow CRUD operations

/**
 * Create a new business flow
 */
export const createFlow = async (payload: NewFlowPayload): Promise<BusinessFlowResponseDTO> => { 
  const res = await instance.post<BusinessFlowResponseDTO>(FLOWS_BASE_PATH, payload);
  return res.data;
};

/**
 * Get all business flows (without pagination) - OLD VERSION
 */
export const getFlows = async (): Promise<BusinessFlowResponseDTO[]> => {
  const res = await instance.get<BusinessFlowResponseDTO[]>(FLOWS_BASE_PATH);
  return res.data;
};

/**
 * Get all business flows without pagination using new backend API
 */
export const getAllFlowsWithoutPagination = async (appId?: number): Promise<BusinessFlowResponseDTO[]> => {
  const params = new URLSearchParams();
  if (appId !== undefined) {
    params.append('appId', appId.toString());
  }
  
  const url = params.toString() ? `${FLOWS_BASE_PATH}/all?${params.toString()}` : `${FLOWS_BASE_PATH}/all`;
  const res = await instance.get<BusinessFlowResponseDTO[]>(url);
  return res.data;
};

/**
 * Get all business flows for a specific app (without pagination)
 */
export const getFlowsByAppId = async (appId: number): Promise<BusinessFlowResponseDTO[]> => {
  const res = await instance.get<BusinessFlowResponseDTO[]>(`${FLOWS_BASE_PATH}?appId=${appId}`);
  return res.data;
};

/**
 * Get paginated business flows by app ID
 */
export const getPaginatedFlows = async (appId?: number, page: number = 1, size: number = 3): Promise<{
  content: BusinessFlowResponseDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}> => {
  const params = new URLSearchParams();
  if (appId !== undefined) params.append('appId', appId.toString());
  params.append('page', page.toString());
  params.append('size', size.toString());
  
  const res = await instance.get(`${FLOWS_BASE_PATH}?${params.toString()}`);
  return res.data;
};

/**
 * Update an existing business flow
 */
export const updateFlow = async (flowData: BusinessFlowResponseDTO): Promise<BusinessFlowResponseDTO> => {
  if (flowData.id === undefined) {
    throw new Error("Flow ID is required for updating.");
  }
  const response = await instance.put<BusinessFlowResponseDTO>(`${FLOWS_BASE_PATH}/${flowData.id}`, flowData);
  return response.data;
};

export const deleteFlow = async (flowId: number): Promise<void> => {
  await instance.delete(`${FLOWS_BASE_PATH}/${flowId}`);
};

/**
 * Analyze a business flow
 */
export const analyzeBusinessFlow = async (payload: FlowAnalysisRequestDTO): Promise<AnalyzeFlowApiResponse> => {
  const response = await instance.post<AnalyzeFlowApiResponse>(`${FLOWS_BASE_PATH}/analyze`, payload);
  return response.data;
};

import instance from './axiosInstance';
import { FlowAnalysisRequestDTO, ApiEndpointRequestDTO, NewFlowPayload, BusinessFlowResponseDTO } from '../types/flow';
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
 * Get all business flows
 */
export const getFlows = async (): Promise<BusinessFlowResponseDTO[]> => {
  const res = await instance.get<BusinessFlowResponseDTO[]>(FLOWS_BASE_PATH);
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
export interface FlowAnalysisRequestDTO {
  flowName: string;
  resultId: number; // Assuming resultId is always present for analysis
  apiEndpoints?: ApiEndpointParamDTO[];
  flowDescription?: string;
  appId: number;
}
  
  // Matches backend BusinessFlowResponseDTO
  export interface BusinessFlowResponseDTO {
    id: number; // Changed from flowId
    flowName: string;
    resultId?: number; // Was sonarQubeResultId, now matches backend DTO
    apiEndpoints: ApiEndpointParamDTO[]; // Changed to match backend DTO
    flowDescription?: string; // Was description
    appId: number;
    // stepsJson: any[]; // Removed as not in new DTO
    // createdAt: string; // Removed as not in new DTO
    // updatedAt?: string; // Removed as not in new DTO
  }
  
  export interface ApiEndpointRequestDTO {
    businessFlowId: number;
    appId: number;
  }

  export interface ApiEndpointParamDTO {
    endpoint: string;
    httpMethod?: string;
    params: string;
  }

  // Matches backend BusinessFlowRequestDTO
  export interface NewFlowPayload {
    flowName: string;
    resultId: number; // Changed from sonarQubeResultId
    apiEndpoints: ApiEndpointParamDTO[]; // Changed to match backend DTO
    flowDescription: string; // Changed from description
    appId: number;
  }

// Updated to match backend BusinessFlowStepResultDTO
export interface StepResult {
  // id: number; // Removed
  // stepName: string; // Removed
  endpoint: string;
  // status: string; // Removed
  // requestBody: string; // Removed
  // responseBody: string; // Removed
  // issues: any[]; // Removed
  staticIssueCount: number;
  passed: boolean;
  // businessFlowResultId: number; // Removed
}

// Updated to match backend BusinessFlowAnalysisResponseDTO
export interface AnalyzeFlowData {
  // id: number; // Removed, assuming this was flowId or analysisId, not directly in BusinessFlowAnalysisResponseDTO
  flowName: string;
  flowDescription: string;
  totalSteps: number;
  passedSteps: number;
  totalStaticIssues: number;
  overallPassed: boolean;
  stepResults: StepResult[];
}

export interface AnalyzeFlowApiResponse {
  message: string;
  data: AnalyzeFlowData;
}
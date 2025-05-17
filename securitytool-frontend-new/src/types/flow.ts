export interface FlowAnalysisRequestDTO {
    flowId: number;
    resultId: number;
  }
  
  // Matches backend BusinessFlowResponseDTO
  export interface BusinessFlowResponseDTO {
    id: number; // Changed from flowId
    flowName: string;
    resultId?: number; // Was sonarQubeResultId, now matches backend DTO
    apiEndpoints?: string[]; // Added to match backend DTO
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

  // Matches backend BusinessFlowRequestDTO
  export interface NewFlowPayload {
    flowName: string;
    resultId: number; // Changed from sonarQubeResultId
    apiEndpoints: string[]; // Changed from endpoints
    flowDescription: string; // Changed from description
    appId: number;
  }
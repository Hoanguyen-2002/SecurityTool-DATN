export interface FlowAnalysisRequestDTO {
    flowId: number;
    resultId: number;
  }
  
  export interface BusinessFlowResponseDTO {
    flowId: number;
    appId: number;
    flowName: string;
    flowDescription: string;
    stepsJson: any[];
    createdAt: string;
    updatedAt?: string;
  }
  
  export interface ApiEndpointRequestDTO {
    businessFlowId: number;
    appId: number;
  }
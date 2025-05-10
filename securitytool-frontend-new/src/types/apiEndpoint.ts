export interface ApiEndpointRequestDTO {
    businessFlowId: number;
    appId: number;
  }
  
  export interface ApiEndpointResponseDTO {
    endpointId: number;
    appId: number;
    path: string;
    method: string;
    params: Record<string, any>;
    responseFormat: Record<string, any>;
    businessFlowId?: number;
    createdAt: string;
  }
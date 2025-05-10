export interface ModuleRequestDTO {
    moduleName: string;
    repositoryPath: string;
    description?: string;
    appId: number; // Added appId
    endpointIds?: number[]; // Added endpointIds (optional)
  }
  
  export interface ModuleResponseDTO {
    id: number;
    moduleName: string;
    repositoryPath: string;
    description?: string;
    appId: number; // Added appId
    endpointIds: number[]; // Added endpointIds
    createdAt: string;
    updatedAt: string;
  }
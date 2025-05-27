export interface ApplicationRequestDTO {
  appName: string;
  appUrl: string;
  basePath?: string; // Changed to optional
  authInfo?: string; // Added authInfo to match the backend's ApplicationRequestDTO
  description?: string; // Added description to match the backend's ApplicationRequestDTO
  techStack?: string; // Added techStack to match the backend's ApplicationRequestDTO
}

export interface ApplicationResponseDTO {
  appId: number;
  appName: string;
  appUrl: string;
  basePath: string;
  authInfo?: string;
  scanStatus: string;
  createdAt: string;
  updatedAt: string;
  description?: string; // Added description to match the backend's ApplicationResponseDTO
  techStack?: string; // Added techStack to match the backend's ApplicationResponseDTO
}
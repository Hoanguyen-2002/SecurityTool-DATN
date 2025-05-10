export interface ApplicationRequestDTO {
  appName: string;
  appUrl: string;
  basePath: string;
  authInfo?: string; // Added authInfo to match the backend's ApplicationRequestDTO
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
}
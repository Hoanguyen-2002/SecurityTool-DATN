export interface ZapScanRequestDTO {
    appId: number;
    targetUrl: string; // Added targetUrl
}

export interface ScanResultDisplay {
    id: number;
    appId: number;
    scanDate: string; // ISO 8601 date string
    scanType: string;
    status: string;
    summary: string; // JSON string
}

export interface ZapScanResponseDTO extends ScanResultDisplay {
    // Add any ZAP-specific fields if necessary in the future
}

export interface ZapEndpointsRequestDTO {
    businessFlowId: number;
    appId: number;
}

export interface ZapEndpointsResponseDTO {
    scanId: number;
    status: string;
}

export interface SonarScanRequestDTO {
    appId: number;
    projectKey: string; // Added projectKey
}

export interface SonarScanResponseDTO extends ScanResultDisplay {
    qualityGateResult?: string; // Keep Sonar-specific fields
}

export interface ScanConfigurationResponseDTO {
    configId: number;
    appId: number;
    sonarConfig: Record<string, any>;
    zapConfig: Record<string, any>;
    customRules: any[];
    createdAt: string;
    updatedAt?: string;
}
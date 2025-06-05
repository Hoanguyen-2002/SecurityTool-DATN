export interface SecurityIssueResponseDTO {
    issueId: number;
    resultId: number;
    endpointId?: number;
    issueType: string;
    severity: string;
    description: string;
    reference?: string; // Added reference field
    solution?: string; // Added new field
    status: string;
    createdAt: string;
  }
  
  export interface ReportResponseDTO {
    applicationId?: number; // legacy, for compatibility
    appId?: number; // new, matches backend
    resultId: number;
    issues: SecurityIssueResponseDTO[];
    summary?: {
      totalIssues: number;
      bySeverity: Record<string, number>;
    };
  }
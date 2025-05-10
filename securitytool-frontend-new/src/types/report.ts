export interface SecurityIssueResponseDTO {
    issueId: number;
    resultId: number;
    endpointId?: number;
    issueType: string;
    severity: string;
    description: string;
    remediation?: string;
    status: string;
    createdAt: string;
  }
  
  export interface ReportResponseDTO {
    resultId: number;
    issues: SecurityIssueResponseDTO[];
    summary?: {
      totalIssues: number;
      bySeverity: Record<string, number>;
    };
  }
export interface DashboardStatsResponseDTO {
    totalApps: number;
    totalScans: number;
    totalIssues: number;
    severityDistribution: Record<string, number>; // Added severityDistribution to match the Dashboard page
}

export interface AppDashboardStatsDTO {
  staticScanCount: number;
  dynamicScanCount: number;
  totalIssues: number;
  severityDistribution: Record<string, number>;
}
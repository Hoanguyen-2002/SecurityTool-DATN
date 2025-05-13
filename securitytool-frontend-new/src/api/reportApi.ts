import instance from './axiosInstance';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';

/**
 * Fetch a report by its scan result ID
 */
export const getReport = async (resultId: number): Promise<ReportResponseDTO> => {
  try {
    const res = await instance.get<any>(`/reports/${resultId}`);
    
    // Check if we got a direct array of SecurityIssueResponseDTO (from backend)
    if (Array.isArray(res.data)) {
      const issues: SecurityIssueResponseDTO[] = res.data;
      
      // Guard against empty response
      if (issues.length === 0) {
        throw new Error(`No issues found for resultId: ${resultId}`);
      }

      // Extract common resultId and extract applicationId from the first issue
      // This assumes all issues have the same resultId and applicationId property
      const sampleIssue = issues[0];
      
      // Create a summary object
      const summary = {
        totalIssues: issues.length,
        bySeverity: issues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {})
      };

      // Determine applicationId - use direct property if available, otherwise use alternative sources
      // This is a fallback mechanism if applicationId isn't directly available from issues
      const applicationId = (sampleIssue as any).applicationId || 
                          (sampleIssue as any).appId || 
                          // Try to extract from query params or localStorage as last resort
                          Number(localStorage.getItem(`scanApp_${resultId}`)) ||
                          0; // Default to 0 if no applicationId can be determined
      
      // Transform the array into the expected ReportResponseDTO structure
      return {
        applicationId,
        resultId: sampleIssue.resultId,
        issues: issues,
        summary
      };
    }
    
    // Check if the response contains nested data array
    if (res.data && res.data.data && Array.isArray(res.data.data)) {
      const issues: SecurityIssueResponseDTO[] = res.data.data;
      
      if (issues.length === 0) {
        throw new Error(`No issues found for resultId: ${resultId}`);
      }
      
      const sampleIssue = issues[0];
      
      const summary = {
        totalIssues: issues.length,
        bySeverity: issues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {})
      };
      
      const applicationId = (sampleIssue as any).applicationId || 
                           (sampleIssue as any).appId || 
                           Number(localStorage.getItem(`scanApp_${resultId}`)) ||
                           0;
      
      return {
        applicationId,
        resultId: sampleIssue.resultId,
        issues: issues,
        summary
      };
    }
    
    // If data is already in ReportResponseDTO format, return as is
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && 'resultId' in res.data) {
      return res.data as ReportResponseDTO;
    }
    
    // If response doesn't match any expected format, throw an error
    throw new Error(`Unable to process response for report ID ${resultId}. Check API endpoint and data format.`);
  } catch (error: any) {
    // Improve error message for debugging
    if (error.response && error.response.status === 404) {
      throw new Error(`Report with ID ${resultId} not found on the server.`);
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Export a report as CSV by its scan result ID
 */
export const exportReportCsv = async (resultId: number): Promise<string> => {
  const res = await instance.get<any>(`/reports/${resultId}/csv`);
  // Handle both direct response and nested response structures
  return res.data && res.data.data ? res.data.data : res.data;
};

/**
 * Store the association between scan result ID and application ID
 */
export const associateScanWithApp = (resultId: number, appId: number): void => {
  localStorage.setItem(`scanApp_${resultId}`, appId.toString());
};
import instance from './axiosInstance';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';

/**
 * Fetch a report by its scan result ID
 */
export const getReport = async (resultId: number): Promise<ReportResponseDTO> => {
  try {
    const res = await instance.get<any>(`/reports/${resultId}`); // Use any for flexibility

    let issuesToProcess: any[] | undefined = undefined; // Allow any type for raw issues
    let preStructuredReport: any | null = null;

    // Scenario 1: Backend returns CommonResponse like { data: [...issues...] }
    if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
      issuesToProcess = res.data.data;
    } 
    // Scenario 2: Backend returns a direct array of issues
    else if (Array.isArray(res.data)) {
      issuesToProcess = res.data;
    } 
    // Scenario 3: Backend returns an object that is already the fully formed ReportResponseDTO
    // (This might happen if data was cached or transformed by another interceptor/service)
    else if (res.data && typeof res.data === 'object' && 
             'issues' in res.data && Array.isArray(res.data.issues) &&
             'resultId' in res.data && typeof res.data.resultId === 'number') {
      // We will still map issues inside this pre-structured report
      preStructuredReport = res.data;
      issuesToProcess = preStructuredReport.issues;
    }

    if (issuesToProcess) {
      if (issuesToProcess.length === 0 && !preStructuredReport) { // if preStructuredReport, it might have other data
        // If the array is empty, it's still a valid response, but no issues to summarize.
        // For now, let's treat it as "no issues found" which might be a valid state.
        // The original code threw an error, let's maintain that for consistency unless specified otherwise.
        // However, an empty issues array is valid for a report.
        // Let's return a report with an empty issues array.
      }

      const mappedIssues: SecurityIssueResponseDTO[] = issuesToProcess.map((apiIssue: any) => ({
        issueId: apiIssue.id, // Map 'id' to 'issueId'
        resultId: apiIssue.resultId,
        endpointId: apiIssue.endpointId,
        issueType: apiIssue.issueType,
        severity: apiIssue.severity,
        description: apiIssue.description,
        remediation: apiIssue.remediation,
        solution: apiIssue.solution, // Added new field
        status: apiIssue.status,
        createdAt: apiIssue.createdAt || new Date(0).toISOString(), // Default for null createdAt
      }));
      
      const summary = {
        totalIssues: mappedIssues.length,
        bySeverity: mappedIssues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {})
      };

      // Determine applicationId from localStorage
      const storedAppIdString = localStorage.getItem(`scanApp_${resultId}`); // Use the overall report's resultId
      if (storedAppIdString === null) {
        throw new Error(`Application ID for scan result ${resultId} not found in local storage. Ensure scan results are correctly associated with applications before attempting to load reports.`);
      }
      
      const determinedApplicationId = Number(storedAppIdString);
      if (isNaN(determinedApplicationId)) {
        throw new Error(`Invalid Application ID format ('${storedAppIdString}') found in local storage for scan result ${resultId}.`);
      }
      
      if (preStructuredReport) {
        // If we had a pre-structured report, use its top-level fields but with mapped issues
        return {
          applicationId: preStructuredReport.applicationId !== undefined ? Number(preStructuredReport.applicationId) : determinedApplicationId,
          resultId: Number(preStructuredReport.resultId), // Ensure it's a number
          issues: mappedIssues,
          summary: preStructuredReport.summary || summary // Prefer existing summary if available
        } as ReportResponseDTO;
      }

      return {
        applicationId: determinedApplicationId,
        resultId: resultId, // Use the function parameter resultId for the overall report
        issues: mappedIssues,
        summary
      };
    }
  
    // If none of the above conditions were met, the response format is unexpected.
    let responsePreview = 'Unable to stringify response data';
    try {
      if (res.data !== undefined) {
        responsePreview = JSON.stringify(res.data).substring(0, 200) + (JSON.stringify(res.data).length > 200 ? '...' : '');
      } else {
        responsePreview = 'Response data is undefined';
      }
    } catch (e) { /* ignore stringify error during preview generation */ }
    throw new Error(`Unable to process response for report ID ${resultId}. Unexpected data format. Preview: ${responsePreview}`);

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
  const res = await instance.get(`/reports/${resultId}/csv`);
  // Handle both direct response and nested response structures
  return res.data.data || res.data;
};

// Store the association between scan result ID and application ID
export const associateScanWithApp = (resultId: number, appId: number): void => {
  localStorage.setItem(`scanApp_${resultId}`, appId.toString());
};
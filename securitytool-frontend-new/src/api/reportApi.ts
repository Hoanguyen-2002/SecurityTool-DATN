import instance from './axiosInstance';
import { ReportResponseDTO, SecurityIssueResponseDTO } from '../types/report';

/**
 * Fetch a report by its scan result ID and application ID
 */
export const getReport = async (resultId: number, appId: number): Promise<ReportResponseDTO> => {
  try {
    const res = await instance.get<any>(`/reports/${resultId}`, {
      params: { appId }
    }); // Use any for flexibility

    let issuesToProcess: any[] | undefined = undefined; // Allow any type for raw issues
    let preStructuredReport: any | null = null;

    // Scenario 1: Backend returns CommonResponse like { data: { ...report... } }
    if (res.data && typeof res.data === 'object' && 'data' in res.data && typeof res.data.data === 'object' && 'appId' in res.data.data) {
      preStructuredReport = res.data.data;
      issuesToProcess = preStructuredReport.issues;
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
        reference: apiIssue.reference, // Add reference field
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

      // Remove all localStorage logic. Use appId/applicationId from backend response if available.
      let determinedApplicationId: number | undefined = undefined;
      if (preStructuredReport) {
        determinedApplicationId = preStructuredReport.appId ?? preStructuredReport.applicationId;
        return {
          applicationId: preStructuredReport.applicationId !== undefined ? Number(preStructuredReport.applicationId) : determinedApplicationId,
          appId: preStructuredReport.appId !== undefined ? Number(preStructuredReport.appId) : determinedApplicationId,
          resultId: Number(preStructuredReport.resultId),
          issues: mappedIssues,
          summary: preStructuredReport.summary || summary
        } as ReportResponseDTO;
      }
      // If no preStructuredReport, just return issues and resultId
      return {
        resultId: resultId,
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
 * Export a report as CSV by its scan result ID and application ID
 */
export const exportReportCsv = async (resultId: number, appId: number): Promise<string> => {
  const res = await instance.get(`/reports/${resultId}/csv`, {
    params: { appId }
  });
  // Handle both direct response and nested response structures
  return res.data.data || res.data;
};

// Store the association between scan result ID and application ID
export const associateScanWithApp = (resultId: number, appId: number): void => {
  localStorage.setItem(`scanApp_${resultId}`, appId.toString());
};
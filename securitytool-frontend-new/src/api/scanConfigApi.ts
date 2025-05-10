import instance from './axiosInstance';
import {
  ZapScanRequestDTO,
  ZapScanResponseDTO,
  ZapEndpointsRequestDTO,
  ZapEndpointsResponseDTO,
  SonarScanRequestDTO,
  SonarScanResponseDTO
} from '../types/scanConfig';

/**Trigger a full OWASP ZAP scan*/
export const triggerZapScan = async (
  data: ZapScanRequestDTO
): Promise<ZapScanResponseDTO> => {
  // Explicitly construct the payload to ensure all required fields are included
  const payload = {
    appId: data.appId,
    targetUrl: data.targetUrl
  };
  // console.log("Sending ZAP scan payload:", payload); // For debugging
  const res = await instance.post('/scan/zap', payload);
  return res.data.data;
};

/**Trigger OWASP ZAP scan for specific endpoints*/
export const triggerZapEndpointsScan = async (
  payload: ZapEndpointsRequestDTO
): Promise<ZapEndpointsResponseDTO> => {
  const res = await instance.post('/scan/zap/endpoints', payload);
  return res.data;
};

/**Trigger a SonarQube static code analysis*/
export const triggerSonarScan = async (
  data: SonarScanRequestDTO
): Promise<SonarScanResponseDTO> => {
  // Explicitly construct the payload to ensure all required fields are included
  const payload = {
    appId: data.appId,
    projectKey: data.projectKey
  };
  // console.log("Sending SonarQube scan payload:", payload); // For debugging
  const res = await instance.post('/scan/sonarqube', payload);
  return res.data.data;
};
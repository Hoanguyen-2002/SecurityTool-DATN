package com.backend.securitytool.constants;

public class ApiConstants {

    // Environment variable keys
    public static final String ENCRYPTION_KEY_ENV = "ENCRYPTION_KEY";

    // API base URLs
    public static final String APPS_BASE_URL = "/api/apps";
    public static final String SCAN_BASE_URL = "/api/scan";
    public static final String ANALYZE_BASE_URL = "/api/analyze";
    public static final String REPORTS_BASE_URL = "/api/reports";
    public static final String DASHBOARD_BASE_URL = "/api/dashboard";

    // Path variables
    public static final String APP_ID_PATH = "/{id}";
    public static final String REPORT_ID_PATH = "/{resultId}";
    public static final String REPORT_CSV_PATH = "/{resultId}/csv";

    // Scan paths
    public static final String SONARQUBE_SCAN_PATH = "/sonarqube";
    public static final String ZAP_SCAN_PATH = "/zap";
    public static final String FLOW_ANALYSIS_PATH = "/flow";

    // Module management
    public static final String MODULES_BASE_URL = "/api/modules";

    private ApiConstants() {
        // Prevent instantiation
    }
}

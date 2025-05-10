package com.backend.securitytool.constants;

public class ScanType {

    // Scan statuses
    public static final String SCAN_STATUS_PENDING = "pending";
    public static final String SCAN_STATUS_IN_PROGRESS = "in-progress";
    public static final String SCAN_STATUS_COMPLETED = "completed";
    public static final String SCAN_STATUS_FAILED = "failed";

    // Scan types
    public static final String SCAN_TYPE_STATIC = "static";
    public static final String SCAN_TYPE_DYNAMIC = "dynamic";

    // Issue statuses
    public static final String ISSUE_STATUS_OPEN = "open";
    public static final String ISSUE_STATUS_RESOLVED = "resolved";

    // Severity levels
    public static final String SEVERITY_LOW = "low";
    public static final String SEVERITY_MEDIUM = "medium";
    public static final String SEVERITY_HIGH = "high";
    public static final String SEVERITY_CRITICAL = "critical";

    private ScanType() {
        // Prevent instantiation
    }
}
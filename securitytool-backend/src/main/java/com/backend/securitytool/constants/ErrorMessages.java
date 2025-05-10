package com.backend.securitytool.constants;

public class ErrorMessages {

    // Resource not found errors
    public static final String APPLICATION_NOT_FOUND = "Application not found with ID: ";
    public static final String BUSINESS_FLOW_NOT_FOUND = "Business flow not found with ID: ";
    public static final String SCAN_RESULT_NOT_FOUND = "Scan result not found with ID: ";

    // Error types
    public static final String RESOURCE_NOT_FOUND_ERROR = "Resource Not Found";
    public static final String ENCRYPTION_ERROR = "Encryption Error";
    public static final String EXTERNAL_API_ERROR = "External API Error";
    public static final String INTERNAL_SERVER_ERROR = "Internal Server Error";

    // Error messages
    public static final String ENCRYPTION_FAILED = "Failed to encrypt auth info";
    public static final String DECRYPTION_FAILED = "Failed to decrypt auth info";
    public static final String EXTERNAL_API_FAILED = "Failed to communicate with external service: ";
    public static final String INTERNAL_SERVER_MESSAGE = "An unexpected error occurred. Please try again later.";

    private ErrorMessages() {
        // Prevent instantiation
    }
}
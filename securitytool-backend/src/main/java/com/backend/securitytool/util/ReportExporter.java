package com.backend.securitytool.util;

import com.backend.securitytool.model.entity.SecurityIssue;

import java.util.List;

public class ReportExporter {

    public static String toCsv(List<SecurityIssue> issues) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Issue Type,Severity,Description,Remediation,Status\n");

        for (SecurityIssue issue : issues) {
            csv.append(issue.getId()).append(",")
                    .append(escapeCsvField(issue.getIssueType())).append(",")
                    .append(escapeCsvField(issue.getSeverity())).append(",")
                    .append(escapeCsvField(issue.getDescription())).append(",")
                    .append(escapeCsvField(issue.getRemediation())).append(",")
                    .append(escapeCsvField(issue.getStatus())).append("\n");
        }

        return csv.toString();
    }

    private static String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        // Escape commas and quotes in the field
        if (field.contains(",") || field.contains("\"")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}

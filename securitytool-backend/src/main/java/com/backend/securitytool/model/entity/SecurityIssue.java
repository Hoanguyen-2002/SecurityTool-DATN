package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "security_issues", schema = "security_tool")
public class SecurityIssue {
    @Id
    @Column(name = "issue_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "result_id")
    private ScanResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "endpoint_id")
    private ApiEndpoint endpoint;

    @Column(name = "issue_type", nullable = false, length = 100)
    private String issueType;

    @Column(name = "severity", nullable = false, length = 50)
    private String severity;

    @Lob
    @Column(name = "description")
    private String description;

    @Lob
    @Column(name = "remediation")
    private String remediation;

    @ColumnDefault("'open'")
    @Column(name = "status", length = 50)
    private String status;
    // Ghi nhận module nếu cần
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "module_id")
    private SourceCodeModule module;
}
package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "business_flows", schema = "security_tool")
public class BusinessFlow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "flow_id", nullable = false)
    private Integer id;

    @Column(name = "flow_name", nullable = false, length = 100)
    private String flowName;

    @Lob
    @Column(name = "flow_description")
    private String flowDescription;

    @Column(name = "api_endpoints", columnDefinition = "TEXT")
    private String apiEndpoints; // JSON string of endpoints

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id")
    private ScanResult result;

    // Add this if you have a mappedBy="app" in TargetApplication
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")
    private TargetApplication app;
}

package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

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
    private String apiEndpoints; // JSON string of List<ApiEndpointParamDTO>

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id")
    private ScanResult result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id")
    private TargetApplication app;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}

package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "target_applications", schema = "security_tool")
public class TargetApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "app_id", nullable = false)
    private Integer id;

    @Column(name = "app_name", nullable = false)
    private String appName;

    @Column(name = "app_url", nullable = false)
    private String appUrl;

    @Column(name = "base_path", length = 100)
    private String basePath;

    @Column(name = "auth_info", length = 512)
    private String authInfo;

    @ColumnDefault("'pending'")
    @Column(name = "scan_status", length = 50)
    private String scanStatus;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "description", length = 1024)
    private String description;

    @Column(name = "tech_stack", length = 256)
    private String techStack;

    @OneToMany(mappedBy = "app")
    private Set<ApiEndpoint> apiEndpoints;

    @OneToMany(mappedBy = "app")
    private Set<BusinessFlow> businessFlows;

    @OneToMany(mappedBy = "app")
    private Set<ScanConfiguration> scanConfigurations;

    @OneToMany(mappedBy = "app", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ScanResult> scanResults;

//    @OneToMany(mappedBy = "modules")
//    private Set<SourceCodeModule> modules;
}

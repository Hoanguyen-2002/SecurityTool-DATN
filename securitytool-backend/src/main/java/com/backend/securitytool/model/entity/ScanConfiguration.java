package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "scan_configurations", schema = "security_tool")
public class ScanConfiguration {
    @Id
    @Column(name = "config_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "app_id")
    private TargetApplication app;

    @Column(name = "sonarqube_config")
    @Lob
    private String sonarqubeConfig;

    @Column(name = "zap_config")
    @Lob
    private String zapConfig;

    @Column(name = "custom_rules")
    @Lob
    private String customRules;


}
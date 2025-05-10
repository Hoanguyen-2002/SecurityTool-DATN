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
@Table(name = "api_endpoints", schema = "security_tool")
public class ApiEndpoint {
    @Id
    @Column(name = "endpoint_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "app_id")
    private TargetApplication app;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "method", nullable = false, length = 10)
    private String method;

    @Column(name = "params")
    @Lob
    private String params;

    @Column(name = "response_format")
    @Lob
    private String responseFormat;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "business_flow_id")
    private BusinessFlow businessFlow;


    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "module_id")
    private SourceCodeModule module;
}
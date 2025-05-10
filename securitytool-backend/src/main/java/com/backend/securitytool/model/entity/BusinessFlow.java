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
@Table(name = "business_flows", schema = "security_tool")
public class BusinessFlow {
    @Id
    @Column(name = "flow_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "app_id")
    private TargetApplication app;

    @Column(name = "flow_name", nullable = false, length = 100)
    private String flowName;

    @Lob
    @Column(name = "flow_description")
    private String flowDescription;

    @Column(name = "steps_json", nullable = false)
    @Lob
    private String stepsJson;

}
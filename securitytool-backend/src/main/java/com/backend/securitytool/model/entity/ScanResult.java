package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "scan_results", schema = "security_tool")
public class ScanResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "app_id")
    private TargetApplication app;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "scan_date")
    private Instant scanDate;

    @Column(name = "scan_type", nullable = false, length = 50)
    private String scanType;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "summary")
    @Lob
    private String summary;

}
package com.backend.securitytool.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "source_code_module", schema="security_tool")
public class SourceCodeModule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="module_id")
    private Integer id;

    @Column(name="module_name", nullable=false)
    private String moduleName;

    @Column(name="description")
    private String description;

    @Column(name="repository_path", nullable=false)
    private String repositoryPath;

}
package com.backend.securitytool.repository;

import com.backend.securitytool.model.entity.ApiEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


public interface ApiEndpointRepository extends JpaRepository<ApiEndpoint, Integer> {
    List<ApiEndpoint> findByAppId(Integer appId);
}

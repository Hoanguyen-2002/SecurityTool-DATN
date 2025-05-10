package com.backend.securitytool.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // Using Spring's default SimpleCacheManager (configured in application.yml)
}

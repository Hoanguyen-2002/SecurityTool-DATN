package com.backend.securitytool.mapper;

import org.mapstruct.Mapper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Mapper(componentModel = "spring")
public interface DashboardStatsMapper {

    default Map<String, Integer> mapSeverityDistribution(List<Object[]> severityCounts) {
        Map<String, Integer> severityDistribution = new HashMap<>();
        for (Object[] severityCount : severityCounts) {
            String severity = (String) severityCount[0];
            Integer count = (Integer) severityCount[1];
            severityDistribution.put(severity, count);
        }
        return severityDistribution;
    }
}

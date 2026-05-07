package com.portfolio.visit.dto;

import com.portfolio.visit.domain.Visit;

public record VisitCreateRequest(
        String pageUrl,
        String referrer,
        String refParam
) {

    public Visit toVisit(String ipAddress, String userAgent) {
        return Visit.create(pageUrl, referrer, refParam, ipAddress, userAgent);
    }
}

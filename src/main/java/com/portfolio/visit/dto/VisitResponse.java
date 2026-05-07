package com.portfolio.visit.dto;

import com.portfolio.visit.domain.Visit;

import java.time.LocalDateTime;

public record VisitResponse(
        Long id,
        String pageUrl,
        String referrer,
        String refParam,
        String ipAddress,
        String userAgent,
        LocalDateTime visitedAt
) {

    public static VisitResponse from(Visit visit) {
        return new VisitResponse(
                visit.getId(),
                visit.getPageUrl(),
                visit.getReferrer(),
                visit.getRefParam(),
                visit.getIpAddress(),
                visit.getUserAgent(),
                visit.getVisitedAt()
        );
    }
}

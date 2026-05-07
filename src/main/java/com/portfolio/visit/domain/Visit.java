package com.portfolio.visit.domain;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Visit {

    private Long id;
    private String pageUrl;
    private String referrer;
    private String refParam;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime visitedAt;

    private Visit(
            String pageUrl,
            String referrer,
            String refParam,
            String ipAddress,
            String userAgent
    ) {
        this.pageUrl = pageUrl;
        this.referrer = referrer;
        this.refParam = refParam;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.visitedAt = LocalDateTime.now();
    }

    public static Visit create(
            String pageUrl,
            String referrer,
            String refParam,
            String ipAddress,
            String userAgent
    ) {
        return new Visit(pageUrl, referrer, refParam, ipAddress, userAgent);
    }
}

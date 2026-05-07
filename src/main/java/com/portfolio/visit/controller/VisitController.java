package com.portfolio.visit.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.common.ApiResponse;
import com.portfolio.visit.dto.VisitCreateRequest;
import com.portfolio.visit.dto.VisitResponse;
import com.portfolio.visit.service.VisitService;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class VisitController {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String USER_AGENT = "User-Agent";

    private final VisitService visitService;

    @PostMapping("/visits")
    public ResponseEntity<ApiResponse<Long>> createVisit(
            @RequestBody VisitCreateRequest request,
            HttpServletRequest httpServletRequest
    ) {
        Long visitId = visitService.createVisit(
                request,
                extractClientIp(httpServletRequest),
                httpServletRequest.getHeader(USER_AGENT)
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(visitId, "방문 로그가 저장되었습니다."));
    }

    @GetMapping("/visits")
    public ResponseEntity<ApiResponse<List<VisitResponse>>> getRecentVisits() {
        List<VisitResponse> visits = visitService.getRecentVisits();
        return ResponseEntity.ok(ApiResponse.success(visits, "방문 로그 조회에 성공했습니다."));
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader(X_FORWARDED_FOR);

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}

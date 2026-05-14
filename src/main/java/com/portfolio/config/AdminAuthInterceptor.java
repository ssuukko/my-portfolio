package com.portfolio.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final String BASIC_PREFIX = "Basic ";

    private final String adminUsername;
    private final String adminPassword;

    public AdminAuthInterceptor(
            @Value("${portfolio.admin-username:ssh}") String adminUsername,
            @Value("${portfolio.admin-password:ssh}") String adminPassword
    ) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if (!requiresAdminToken(request)) {
            return true;
        }

        if (adminUsername == null || adminUsername.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            return false;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        String credentials = decodeBasicCredentials(authorization);

        if (!credentials.equals(adminUsername + ":" + adminPassword)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }

        return true;
    }

    private boolean requiresAdminToken(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if (method.equals("OPTIONS")) {
            return false;
        }

        if (path.equals("/api/health")) {
            return false;
        }

        if (path.equals("/api/projects/summary")) {
            return false;
        }

        if (method.equals("GET") && path.matches("^/api/projects/\\d+$")) {
            return false;
        }

        if (method.equals("GET") && path.matches("^/api/projects/\\d+/thumbnail$")) {
            return false;
        }

        if (method.equals("POST") && path.equals("/api/visits")) {
            return false;
        }

        return path.startsWith("/api/projects") || path.startsWith("/api/uploads") || path.equals("/api/visits");
    }

    private String decodeBasicCredentials(String authorization) {
        if (authorization == null || !authorization.startsWith(BASIC_PREFIX)) {
            return "";
        }

        try {
            byte[] decodedBytes = Base64.getDecoder().decode(authorization.substring(BASIC_PREFIX.length()));
            return new String(decodedBytes, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            return "";
        }
    }
}

package com.portfolio.project.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ProjectOrderUpdateRequest(
        @NotEmpty(message = "정렬할 프로젝트 목록은 필수입니다.")
        List<Long> projectIds
) {
}

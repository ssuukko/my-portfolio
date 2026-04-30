package com.portfolio.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record ProjectUpdateRequest(
        @NotBlank(message = "프로젝트 제목은 필수입니다.")
        String title,
        String summary,
        String description,
        String thumbnailUrl,
        String featureImageUrls,
        String featureImageCaptions,
        String projectUrl,
        LocalDate startDate,
        LocalDate endDate,
        String useYn,
        String techStack,
        String myRole,
        String troubleShooting,
        String githubUrl,
        String deployUrl,
        String result
) {
}

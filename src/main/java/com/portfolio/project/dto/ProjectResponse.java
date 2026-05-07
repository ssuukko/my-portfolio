package com.portfolio.project.dto;

import com.portfolio.project.domain.Project;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
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
        String result,
        Integer displayOrder,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getSummary(),
                project.getDescription(),
                project.getThumbnailUrl(),
                project.getFeatureImageUrls(),
                project.getFeatureImageCaptions(),
                project.getProjectUrl(),
                project.getStartDate(),
                project.getEndDate(),
                project.getUseYn(),
                project.getTechStack(),
                project.getMyRole(),
                project.getTroubleShooting(),
                project.getGithubUrl(),
                project.getDeployUrl(),
                project.getResult(),
                project.getDisplayOrder(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}

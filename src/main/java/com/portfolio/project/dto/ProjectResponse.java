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
        String attachmentFilename,
        String attachmentContentType,
        Long attachmentFileSize,
        Boolean hasAttachment,
        Boolean hasPortfolio,
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
                project.getAttachmentFilename(),
                project.getAttachmentContentType(),
                project.getAttachmentFileSize(),
                project.getAttachmentFilename() != null && !project.getAttachmentFilename().isBlank(),
                project.getAttachmentFilename() != null && !project.getAttachmentFilename().isBlank(),
                project.getDisplayOrder(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    public static ProjectResponse fromSummary(Project project) {
        String thumbnailUrl = project.getThumbnailUrl();

        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getSummary(),
                null,
                isDataUrl(thumbnailUrl) ? null : thumbnailUrl,
                null,
                null,
                project.getProjectUrl(),
                project.getStartDate(),
                project.getEndDate(),
                project.getUseYn(),
                null,
                null,
                null,
                project.getGithubUrl(),
                project.getDeployUrl(),
                null,
                null,
                null,
                null,
                Boolean.TRUE.equals(project.getHasAttachment()),
                Boolean.TRUE.equals(project.getHasPortfolio()) || Boolean.TRUE.equals(project.getHasAttachment()),
                project.getDisplayOrder(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private static boolean isDataUrl(String value) {
        return value != null && value.regionMatches(true, 0, "data:", 0, 5);
    }
}

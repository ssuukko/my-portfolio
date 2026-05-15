package com.portfolio.project.dto;

import com.portfolio.project.domain.Project;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
        List<TroubleShootingItem> troubleShootingItems,
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
                TroubleShootingItems.parse(project.getTroubleShooting()),
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
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getSummary(),
                null,
                project.getThumbnailUrl(),
                null,
                null,
                project.getProjectUrl(),
                project.getStartDate(),
                project.getEndDate(),
                project.getUseYn(),
                null,
                null,
                null,
                List.of(),
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
}

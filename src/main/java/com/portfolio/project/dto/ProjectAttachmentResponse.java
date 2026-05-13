package com.portfolio.project.dto;

import com.portfolio.project.domain.Project;

public record ProjectAttachmentResponse(
        Long projectId,
        String filename,
        String contentType,
        Long fileSize,
        byte[] data
) {

    public static ProjectAttachmentResponse from(Project project) {
        return new ProjectAttachmentResponse(
                project.getId(),
                project.getAttachmentFilename(),
                project.getAttachmentContentType(),
                project.getAttachmentFileSize(),
                project.getAttachmentData()
        );
    }
}

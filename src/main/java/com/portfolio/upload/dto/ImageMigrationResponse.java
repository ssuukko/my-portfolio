package com.portfolio.upload.dto;

public record ImageMigrationResponse(
        int scannedProjects,
        int updatedProjects,
        int migratedImages
) {
}

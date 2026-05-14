package com.portfolio.upload.service;

import com.portfolio.project.domain.Project;
import com.portfolio.project.mapper.ProjectMapper;
import com.portfolio.upload.dto.ImageMigrationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectImageMigrationService {

    private final ProjectMapper projectMapper;
    private final CloudinaryUploadService cloudinaryUploadService;

    public ImageMigrationResponse migrateDataUrlImages() throws IOException {
        List<Project> projects = projectMapper.findAll();
        int updatedProjects = 0;
        int migratedImages = 0;

        for (Project project : projects) {
            MigrationResult thumbnailResult = migrateThumbnail(project);
            MigrationResult featureImageResult = migrateFeatureImages(project);

            if (thumbnailResult.changed() || featureImageResult.changed()) {
                projectMapper.updateImages(
                        project.getId(),
                        thumbnailResult.value(),
                        featureImageResult.value()
                );
                updatedProjects += 1;
                migratedImages += thumbnailResult.migratedCount() + featureImageResult.migratedCount();
            }
        }

        return new ImageMigrationResponse(projects.size(), updatedProjects, migratedImages);
    }

    private MigrationResult migrateThumbnail(Project project) throws IOException {
        String thumbnailUrl = project.getThumbnailUrl();
        if (!cloudinaryUploadService.isDataImageUrl(thumbnailUrl)) {
            return new MigrationResult(thumbnailUrl, false, 0);
        }

        String filename = "project-" + project.getId() + "-thumbnail";
        String uploadedUrl = cloudinaryUploadService.uploadDataUrl(thumbnailUrl, filename).url();
        return new MigrationResult(uploadedUrl, true, 1);
    }

    private MigrationResult migrateFeatureImages(Project project) throws IOException {
        String featureImageUrls = project.getFeatureImageUrls();
        if (featureImageUrls == null || featureImageUrls.isBlank()) {
            return new MigrationResult(featureImageUrls, false, 0);
        }

        String[] lines = featureImageUrls.split("\\R", -1);
        List<String> nextLines = new ArrayList<>(lines.length);
        boolean changed = false;
        int migratedCount = 0;
        int imageIndex = 1;

        for (String line : lines) {
            String trimmedLine = line.trim();

            if (cloudinaryUploadService.isDataImageUrl(trimmedLine)) {
                String filename = "project-" + project.getId() + "-feature-" + imageIndex;
                nextLines.add(cloudinaryUploadService.uploadDataUrl(trimmedLine, filename).url());
                changed = true;
                migratedCount += 1;
            } else {
                nextLines.add(line);
            }

            if (!trimmedLine.isBlank()) {
                imageIndex += 1;
            }
        }

        return new MigrationResult(String.join("\n", nextLines), changed, migratedCount);
    }

    private record MigrationResult(
            String value,
            boolean changed,
            int migratedCount
    ) {
    }
}

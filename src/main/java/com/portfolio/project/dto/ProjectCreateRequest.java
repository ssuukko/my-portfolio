package com.portfolio.project.dto;

import com.portfolio.project.domain.Project;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record ProjectCreateRequest(
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
        List<TroubleShootingItem> troubleShootingItems,
        String githubUrl,
        String deployUrl,
        String result,
        Integer displayOrder
) {

    public Project toProject() {
        return Project.create(
                title,
                summary,
                description,
                thumbnailUrl,
                featureImageUrls,
                featureImageCaptions,
                projectUrl,
                startDate,
                endDate,
                useYn,
                techStack,
                myRole,
                TroubleShootingItems.serialize(troubleShootingItems, troubleShooting),
                githubUrl,
                deployUrl,
                result,
                displayOrder
        );
    }
}

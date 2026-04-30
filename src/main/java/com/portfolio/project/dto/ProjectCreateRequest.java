package com.portfolio.project.dto;

import com.portfolio.project.domain.Project;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record ProjectCreateRequest(
        @NotBlank(message = "프로젝트 제목은 필수입니다.")
        String title,
        String summary,
        String description,
        String thumbnailUrl,
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

    public Project toProject() {
        return Project.create(
                title,
                summary,
                description,
                thumbnailUrl,
                projectUrl,
                startDate,
                endDate,
                useYn,
                techStack,
                myRole,
                troubleShooting,
                githubUrl,
                deployUrl,
                result
        );
    }
}

package com.portfolio.project.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    private Long id;
    private String title;
    private String summary;
    private String description;
    private String thumbnailUrl;
    private String featureImageUrls;
    private String projectUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private String useYn;
    private String techStack;
    private String myRole;
    private String troubleShooting;
    private String githubUrl;
    private String deployUrl;
    private String result;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Project(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            String featureImageUrls,
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
        validateTitle(title);
        validatePeriod(startDate, endDate);
        validateUseYn(useYn);
        this.title = title;
        this.summary = summary;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.featureImageUrls = featureImageUrls;
        this.projectUrl = projectUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.useYn = normalizeUseYn(useYn);
        this.techStack = techStack;
        this.myRole = myRole;
        this.troubleShooting = troubleShooting;
        this.githubUrl = githubUrl;
        this.deployUrl = deployUrl;
        this.result = result;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public static Project create(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            String featureImageUrls,
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
        return new Project(
                title,
                summary,
                description,
                thumbnailUrl,
                featureImageUrls,
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

    public void updateInfo(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            String featureImageUrls,
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
        validateTitle(title);
        validatePeriod(startDate, endDate);
        validateUseYn(useYn);
        this.title = title;
        this.summary = summary;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.featureImageUrls = featureImageUrls;
        this.projectUrl = projectUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.useYn = normalizeUseYn(useYn);
        this.techStack = techStack;
        this.myRole = myRole;
        this.troubleShooting = troubleShooting;
        this.githubUrl = githubUrl;
        this.deployUrl = deployUrl;
        this.result = result;
        this.updatedAt = LocalDateTime.now();
    }

    private void validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("프로젝트 제목은 필수입니다.");
        }
    }

    private void validatePeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("프로젝트 종료일은 시작일보다 빠를 수 없습니다.");
        }
    }

    private void validateUseYn(String useYn) {
        String normalizedUseYn = normalizeUseYn(useYn);

        if (!normalizedUseYn.equals("Y") && !normalizedUseYn.equals("N")) {
            throw new IllegalArgumentException("프로젝트 사용 여부는 Y 또는 N이어야 합니다.");
        }
    }

    private String normalizeUseYn(String useYn) {
        if (useYn == null || useYn.isBlank()) {
            return "Y";
        }

        return useYn.trim().toUpperCase();
    }
}

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
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Project(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateTitle(title);
        validatePeriod(startDate, endDate);
        this.title = title;
        this.summary = summary;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public static Project create(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return new Project(title, summary, description, thumbnailUrl, startDate, endDate);
    }

    public void updateInfo(
            String title,
            String summary,
            String description,
            String thumbnailUrl,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateTitle(title);
        validatePeriod(startDate, endDate);
        this.title = title;
        this.summary = summary;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.startDate = startDate;
        this.endDate = endDate;
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
}

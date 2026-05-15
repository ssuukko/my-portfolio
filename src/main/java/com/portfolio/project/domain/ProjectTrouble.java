package com.portfolio.project.domain;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectTrouble {

    private Long id;
    private Long projectId;
    private String title;
    private String problem;
    private Long selectedSolutionId;
    private String selectedReason;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

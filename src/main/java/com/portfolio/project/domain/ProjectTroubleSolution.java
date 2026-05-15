package com.portfolio.project.domain;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectTroubleSolution {

    private Long id;
    private Long troubleId;
    private String title;
    private String content;
    private String pros;
    private String cons;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

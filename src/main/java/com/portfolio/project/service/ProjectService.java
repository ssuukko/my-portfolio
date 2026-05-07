package com.portfolio.project.service;

import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;

import java.util.List;

public interface ProjectService {

    Long createProject(ProjectCreateRequest request);

    ProjectResponse getProject(Long id);

    List<ProjectResponse> getAllProjects();

    void updateProject(Long id, ProjectUpdateRequest request);

    void updateProjectOrder(ProjectOrderUpdateRequest request);

    void deleteProject(Long id);
}

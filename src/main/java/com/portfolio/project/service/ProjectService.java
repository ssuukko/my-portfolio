package com.portfolio.project.service;

import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.domain.Project;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProjectService {

    Long createProject(ProjectCreateRequest request);

    ProjectResponse getProject(Long id);

    Project getProjectWithAttachment(Long id);

    List<ProjectResponse> getAllProjects();

    List<ProjectResponse> getProjectSummaries();

    void updateProject(Long id, ProjectUpdateRequest request);

    void updateProjectOrder(ProjectOrderUpdateRequest request);

    ProjectResponse uploadAttachment(Long id, MultipartFile file);

    void deleteAttachment(Long id);

    void deleteProject(Long id);
}

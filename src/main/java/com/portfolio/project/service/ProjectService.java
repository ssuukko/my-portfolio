package com.portfolio.project.service;

import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectAttachmentResponse;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ProjectService {

    Long createProject(ProjectCreateRequest request);

    ProjectResponse getProject(Long id);

    List<ProjectResponse> getAllProjects();

    List<ProjectResponse> getProjectSummaries();

    void updateProject(Long id, ProjectUpdateRequest request);

    void updateProjectOrder(ProjectOrderUpdateRequest request);

    ProjectResponse uploadProjectAttachment(Long id, MultipartFile file) throws IOException;

    ProjectAttachmentResponse getProjectAttachment(Long id);

    void deleteProjectAttachment(Long id);

    void deleteProject(Long id);
}

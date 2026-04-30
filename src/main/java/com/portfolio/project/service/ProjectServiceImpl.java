package com.portfolio.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.project.domain.Project;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.mapper.ProjectMapper;

import java.util.List;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {

    private final ProjectMapper projectMapper;

    @Override
    @Transactional
    public Long createProject(ProjectCreateRequest request) {
        Project project = request.toProject();
        projectMapper.save(project);
        return project.getId();
    }

    @Override
    public ProjectResponse getProject(Long id) {
        Project project = findProject(id);
        return ProjectResponse.from(project);
    }

    @Override
    public List<ProjectResponse> getAllProjects() {
        return projectMapper.findAll()
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void updateProject(Long id, ProjectUpdateRequest request) {
        Project project = findProject(id);
        project.updateInfo(
                request.title(),
                request.summary(),
                request.description(),
                request.thumbnailUrl(),
                request.projectUrl(),
                request.startDate(),
                request.endDate(),
                request.useYn(),
                request.techStack(),
                request.myRole(),
                request.troubleShooting(),
                request.githubUrl(),
                request.deployUrl(),
                request.result()
        );
        projectMapper.update(project);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        Project project = findProject(id);
        projectMapper.deleteById(project.getId());
    }

    private Project findProject(Long id) {
        return projectMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다. id=" + id));
    }
}

package com.portfolio.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.project.domain.Project;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.mapper.ProjectMapper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        if (project.getDisplayOrder() == 0) {
            project.updateDisplayOrder(projectMapper.findNextDisplayOrder());
        }
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
                request.featureImageUrls(),
                request.featureImageCaptions(),
                request.projectUrl(),
                request.startDate(),
                request.endDate(),
                request.useYn(),
                request.techStack(),
                request.myRole(),
                request.troubleShooting(),
                request.githubUrl(),
                request.deployUrl(),
                request.result(),
                request.displayOrder() == null ? project.getDisplayOrder() : request.displayOrder()
        );
        projectMapper.update(project);
    }

    @Override
    @Transactional
    public void updateProjectOrder(ProjectOrderUpdateRequest request) {
        List<Long> projectIds = request.projectIds();
        Set<Long> uniqueProjectIds = new HashSet<>(projectIds);

        if (uniqueProjectIds.size() != projectIds.size()) {
            throw new IllegalArgumentException("프로젝트 순서 목록에 중복된 id가 있습니다.");
        }

        for (int index = 0; index < projectIds.size(); index += 1) {
            validateProjectExists(projectIds.get(index));
            projectMapper.updateDisplayOrder(projectIds.get(index), index + 1);
        }
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

    private void validateProjectExists(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("프로젝트 id는 필수입니다.");
        }

        findProject(id);
    }
}

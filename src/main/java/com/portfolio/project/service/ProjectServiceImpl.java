package com.portfolio.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.portfolio.chat.service.PineconeProjectSyncService;
import com.portfolio.deploy.service.DeployHookService;
import com.portfolio.project.domain.Project;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.mapper.ProjectMapper;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {

    private static final long MAX_ATTACHMENT_SIZE = 20L * 1024L * 1024L;
    private static final List<String> ALLOWED_ATTACHMENT_EXTENSIONS = List.of(".ppt", ".pptx", ".pdf");

    private final ProjectMapper projectMapper;
    private final PineconeProjectSyncService pineconeProjectSyncService;
    private final DeployHookService deployHookService;

    @Override
    @Transactional
    public Long createProject(ProjectCreateRequest request) {
        Project project = request.toProject();
        if (project.getDisplayOrder() == 0) {
            project.updateDisplayOrder(projectMapper.findNextDisplayOrder());
        }
        projectMapper.save(project);
        pineconeProjectSyncService.upsert(project);
        return project.getId();
    }

    @Override
    public ProjectResponse getProject(Long id) {
        Project project = findProject(id);
        return ProjectResponse.from(project);
    }

    @Override
    public Project getProjectWithAttachment(Long id) {
        Project project = findProject(id);

        if (project.getAttachmentData() == null || project.getAttachmentData().length == 0) {
            throw new IllegalArgumentException("등록된 프로젝트 첨부파일이 없습니다.");
        }

        return project;
    }

    @Override
    public List<ProjectResponse> getAllProjects() {
        return projectMapper.findAll()
                .stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @Override
    public List<ProjectResponse> getProjectSummaries() {
        return projectMapper.findSummaries()
                .stream()
                .map(ProjectResponse::fromSummary)
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
        pineconeProjectSyncService.upsert(project);
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
    public ProjectResponse uploadAttachment(Long id, MultipartFile file) {
        Project project = findProject(id);
        validateAttachment(file);

        try {
            project.updateAttachment(
                    file.getOriginalFilename(),
                    normalizeAttachmentContentType(file.getContentType(), file.getOriginalFilename()),
                    file.getSize(),
                    file.getBytes()
            );
            projectMapper.updateAttachment(project);
            deployHookService.triggerPortfolioDeploy();
            return ProjectResponse.from(project);
        } catch (java.io.IOException exception) {
            throw new IllegalArgumentException("첨부파일을 읽지 못했습니다.", exception);
        }
    }

    @Override
    @Transactional
    public void deleteAttachment(Long id) {
        Project project = findProject(id);
        project.deleteAttachment();
        projectMapper.updateAttachment(project);
        deployHookService.triggerPortfolioDeploy();
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        Project project = findProject(id);
        projectMapper.deleteById(project.getId());
        pineconeProjectSyncService.delete(project.getId());
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

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 첨부파일을 선택해 주세요.");
        }

        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("첨부파일은 20MB 이하만 업로드할 수 있습니다.");
        }

        String filename = file.getOriginalFilename();
        String lowerFilename = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        boolean hasAllowedExtension = ALLOWED_ATTACHMENT_EXTENSIONS.stream().anyMatch(lowerFilename::endsWith);

        if (!hasAllowedExtension) {
            throw new IllegalArgumentException("PPT, PPTX, PDF 파일만 업로드할 수 있습니다.");
        }
    }

    private String normalizeAttachmentContentType(String contentType, String filename) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }

        String lowerFilename = filename == null ? "" : filename.toLowerCase(Locale.ROOT);

        if (lowerFilename.endsWith(".ppt")) {
            return "application/vnd.ms-powerpoint";
        }

        if (lowerFilename.endsWith(".pptx")) {
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        }

        return "application/pdf";
    }
}

package com.portfolio.project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.portfolio.chat.service.PineconeProjectSyncService;
import com.portfolio.project.domain.Project;
import com.portfolio.project.domain.ProjectTrouble;
import com.portfolio.project.domain.ProjectTroubleSolution;
import com.portfolio.project.dto.ProjectAttachmentResponse;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.dto.TroubleShootingItem;
import com.portfolio.project.dto.TroubleShootingItems;
import com.portfolio.project.dto.TroubleShootingSolution;
import com.portfolio.project.mapper.ProjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectServiceImpl implements ProjectService {

    private static final long MAX_ATTACHMENT_SIZE = 20L * 1024 * 1024;
    private static final Set<String> ALLOWED_ATTACHMENT_EXTENSIONS = Set.of(".pdf", ".ppt", ".pptx");

    private final ProjectMapper projectMapper;
    private final PineconeProjectSyncService pineconeProjectSyncService;

    @Override
    @Transactional
    public Long createProject(ProjectCreateRequest request) {
        Project project = request.toProject();
        if (project.getDisplayOrder() == 0) {
            project.updateDisplayOrder(projectMapper.findNextDisplayOrder());
        }
        projectMapper.save(project);
        replaceTroubleShootingItems(project.getId(), TroubleShootingItems.parse(project.getTroubleShooting()));
        pineconeProjectSyncService.upsert(project);
        return project.getId();
    }

    @Override
    public ProjectResponse getProject(Long id) {
        Project project = findProject(id);
        return ProjectResponse.from(project, findTroubleShootingItems(project));
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
                request.serializedTroubleShooting(),
                request.githubUrl(),
                request.deployUrl(),
                request.result(),
                request.displayOrder() == null ? project.getDisplayOrder() : request.displayOrder()
        );
        projectMapper.update(project);
        replaceTroubleShootingItems(project.getId(), TroubleShootingItems.parse(project.getTroubleShooting()));
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
    public ProjectResponse uploadProjectAttachment(Long id, MultipartFile file) throws IOException {
        Project project = findProject(id);
        validateAttachment(file);

        String filename = getAttachmentFilename(file);
        project.updateAttachment(
                filename,
                normalizeContentType(file.getContentType()),
                file.getSize(),
                file.getBytes()
        );
        projectMapper.updateAttachment(project);
        return ProjectResponse.from(project);
    }

    @Override
    public ProjectAttachmentResponse getProjectAttachment(Long id) {
        Project project = projectMapper.findAttachmentById(id)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다. id=" + id));

        if (
                project.getAttachmentFilename() == null ||
                project.getAttachmentData() == null ||
                project.getAttachmentData().length == 0
        ) {
            throw new IllegalArgumentException("첨부파일을 찾을 수 없습니다. id=" + id);
        }

        return ProjectAttachmentResponse.from(project);
    }

    @Override
    @Transactional
    public void deleteProjectAttachment(Long id) {
        validateProjectExists(id);
        projectMapper.deleteAttachment(id);
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

    private List<TroubleShootingItem> findTroubleShootingItems(Project project) {
        List<ProjectTrouble> troubles = projectMapper.findTroublesByProjectId(project.getId());

        if (troubles.isEmpty()) {
            return TroubleShootingItems.parse(project.getTroubleShooting());
        }

        Map<Long, List<ProjectTroubleSolution>> solutionsByTroubleId = projectMapper
                .findTroubleSolutionsByProjectId(project.getId())
                .stream()
                .collect(Collectors.groupingBy(ProjectTroubleSolution::getTroubleId));

        List<TroubleShootingItem> items = new ArrayList<>();

        for (ProjectTrouble trouble : troubles) {
            List<ProjectTroubleSolution> solutionRows = solutionsByTroubleId.getOrDefault(
                    trouble.getId(),
                    List.of()
            );
            List<TroubleShootingSolution> solutions = solutionRows.stream()
                    .map((solution) -> new TroubleShootingSolution(
                            solution.getTitle(),
                            solution.getContent(),
                            solution.getPros(),
                            solution.getCons()
                    ))
                    .toList();
            Integer selectedSolutionIndex = getSelectedSolutionIndex(
                    solutionRows,
                    trouble.getSelectedSolutionId()
            );

            items.add(new TroubleShootingItem(
                    trouble.getTitle(),
                    trouble.getProblem(),
                    null,
                    solutions,
                    selectedSolutionIndex,
                    trouble.getSelectedReason()
            ));
        }

        return items;
    }

    private void replaceTroubleShootingItems(Long projectId, List<TroubleShootingItem> items) {
        projectMapper.deleteTroublesByProjectId(projectId);

        for (int troubleIndex = 0; troubleIndex < items.size(); troubleIndex += 1) {
            TroubleShootingItem item = items.get(troubleIndex);
            ProjectTrouble trouble = new ProjectTrouble();
            trouble.setProjectId(projectId);
            trouble.setTitle(item.title());
            trouble.setProblem(item.problem());
            trouble.setSelectedReason(item.selectedReason());
            trouble.setSortOrder(troubleIndex + 1);
            trouble.setCreatedAt(LocalDateTime.now());
            trouble.setUpdatedAt(trouble.getCreatedAt());

            projectMapper.insertTrouble(trouble);

            List<TroubleShootingSolution> solutions = item.solutions() == null
                    ? List.of()
                    : item.solutions();
            Long selectedSolutionId = null;

            for (int solutionIndex = 0; solutionIndex < solutions.size(); solutionIndex += 1) {
                TroubleShootingSolution solution = solutions.get(solutionIndex);
                ProjectTroubleSolution solutionRow = new ProjectTroubleSolution();
                solutionRow.setTroubleId(trouble.getId());
                solutionRow.setTitle(solution.title());
                solutionRow.setContent(solution.content());
                solutionRow.setPros(solution.pros());
                solutionRow.setCons(solution.cons());
                solutionRow.setSortOrder(solutionIndex + 1);
                solutionRow.setCreatedAt(LocalDateTime.now());
                solutionRow.setUpdatedAt(solutionRow.getCreatedAt());

                projectMapper.insertTroubleSolution(solutionRow);

                if (item.selectedSolutionIndex() != null && item.selectedSolutionIndex() == solutionIndex) {
                    selectedSolutionId = solutionRow.getId();
                }
            }

            if (selectedSolutionId != null) {
                projectMapper.updateTroubleSelectedSolution(trouble.getId(), selectedSolutionId);
            }
        }
    }

    private Integer getSelectedSolutionIndex(
            List<ProjectTroubleSolution> solutions,
            Long selectedSolutionId
    ) {
        if (selectedSolutionId == null) {
            return solutions.isEmpty() ? null : 0;
        }

        for (int index = 0; index < solutions.size(); index += 1) {
            if (selectedSolutionId.equals(solutions.get(index).getId())) {
                return index;
            }
        }

        return solutions.isEmpty() ? null : 0;
    }

    private void validateProjectExists(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("프로젝트 id는 필수입니다.");
        }

        findProject(id);
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("첨부파일은 필수입니다.");
        }

        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("첨부파일은 20MB 이하만 업로드할 수 있습니다.");
        }

        String filename = getAttachmentFilename(file);
        String lowerFilename = filename.toLowerCase();
        boolean isAllowedFile = ALLOWED_ATTACHMENT_EXTENSIONS.stream()
                .anyMatch(lowerFilename::endsWith);

        if (!isAllowedFile) {
            throw new IllegalArgumentException("PPT, PPTX, PDF 파일만 업로드할 수 있습니다.");
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }

        return contentType;
    }

    private String getAttachmentFilename(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("첨부파일 이름을 확인할 수 없습니다.");
        }

        return StringUtils.cleanPath(originalFilename);
    }
}

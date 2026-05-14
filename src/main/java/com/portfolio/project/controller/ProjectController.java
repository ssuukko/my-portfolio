package com.portfolio.project.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.portfolio.common.ApiResponse;
import com.portfolio.deploy.service.DeployHookService;
import com.portfolio.project.dto.ProjectAttachmentResponse;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.service.ProjectService;
import jakarta.validation.Valid;

import java.io.IOException;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService projectService;
    private final DeployHookService deployHookService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("OK", "서버가 정상적으로 동작 중입니다."));
    }

    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<Long>> createProject(
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        Long projectId = projectService.createProject(request);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectId, "프로젝트가 생성되었습니다. 정적 포트폴리오 재배포를 요청했습니다."));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success(projects, "프로젝트 목록 조회에 성공했습니다."));
    }

    @GetMapping("/projects/summary")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjectSummaries() {
        List<ProjectResponse> projects = projectService.getProjectSummaries();
        return ResponseEntity.ok(ApiResponse.success(projects, "프로젝트 요약 목록 조회에 성공했습니다."));
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long id) {
        ProjectResponse project = projectService.getProject(id);
        return ResponseEntity.ok(ApiResponse.success(project, "프로젝트 조회에 성공했습니다."));
    }

    @GetMapping("/projects/{id}/attachment")
    public ResponseEntity<byte[]> getProjectAttachment(@PathVariable Long id) {
        ProjectAttachmentResponse attachment = projectService.getProjectAttachment(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.contentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(attachment.filename())
                                .build()
                                .toString()
                )
                .body(attachment.data());
    }

    @PostMapping(value = "/projects/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProjectResponse>> uploadProjectAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        ProjectResponse project = projectService.uploadProjectAttachment(id, file);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity.ok(ApiResponse.success(project, "첨부파일이 업로드되었습니다."));
    }

    @DeleteMapping("/projects/{id}/attachment")
    public ResponseEntity<ApiResponse<Void>> deleteProjectAttachment(@PathVariable Long id) {
        projectService.deleteProjectAttachment(id);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity.ok(ApiResponse.success(null, "첨부파일이 삭제되었습니다."));
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectUpdateRequest request
    ) {
        projectService.updateProject(id, request);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트가 수정되었습니다. 정적 포트폴리오 재배포를 요청했습니다."));
    }

    @PutMapping("/projects/order")
    public ResponseEntity<ApiResponse<Void>> updateProjectOrder(
            @Valid @RequestBody ProjectOrderUpdateRequest request
    ) {
        projectService.updateProjectOrder(request);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트 순서가 변경되었습니다. 정적 포트폴리오 재배포를 요청했습니다."));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        deployHookService.triggerPortfolioDeploy();
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트가 삭제되었습니다. 정적 포트폴리오 재배포를 요청했습니다."));
    }
}

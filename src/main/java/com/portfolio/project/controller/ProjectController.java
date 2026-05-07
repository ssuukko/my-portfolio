package com.portfolio.project.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portfolio.common.ApiResponse;
import com.portfolio.project.dto.ProjectCreateRequest;
import com.portfolio.project.dto.ProjectOrderUpdateRequest;
import com.portfolio.project.dto.ProjectResponse;
import com.portfolio.project.dto.ProjectUpdateRequest;
import com.portfolio.project.service.ProjectService;
import jakarta.validation.Valid;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("OK", "서버가 정상적으로 동작 중입니다."));
    }

    @PostMapping("/projects")
    public ResponseEntity<ApiResponse<Long>> createProject(
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        Long projectId = projectService.createProject(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectId, "프로젝트가 생성되었습니다."));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllProjects() {
        List<ProjectResponse> projects = projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success(projects, "프로젝트 목록 조회에 성공했습니다."));
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable Long id) {
        ProjectResponse project = projectService.getProject(id);
        return ResponseEntity.ok(ApiResponse.success(project, "프로젝트 조회에 성공했습니다."));
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectUpdateRequest request
    ) {
        projectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트가 수정되었습니다."));
    }

    @PutMapping("/projects/order")
    public ResponseEntity<ApiResponse<Void>> updateProjectOrder(
            @Valid @RequestBody ProjectOrderUpdateRequest request
    ) {
        projectService.updateProjectOrder(request);
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트 순서가 변경되었습니다."));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "프로젝트가 삭제되었습니다."));
    }
}

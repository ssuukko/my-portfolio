package com.portfolio.upload.controller;

import com.portfolio.common.ApiResponse;
import com.portfolio.upload.dto.ImageMigrationResponse;
import com.portfolio.upload.dto.ImageUploadResponse;
import com.portfolio.upload.service.CloudinaryUploadService;
import com.portfolio.upload.service.ProjectImageMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/uploads")
public class UploadController {

    private final CloudinaryUploadService cloudinaryUploadService;
    private final ProjectImageMigrationService projectImageMigrationService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        ImageUploadResponse uploadResponse = cloudinaryUploadService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success(uploadResponse, "이미지가 업로드되었습니다."));
    }

    @PostMapping("/images/migrate-data-urls")
    public ResponseEntity<ApiResponse<ImageMigrationResponse>> migrateDataUrlImages() throws IOException {
        ImageMigrationResponse migrationResponse = projectImageMigrationService.migrateDataUrlImages();
        return ResponseEntity.ok(ApiResponse.success(migrationResponse, "기존 data URL 이미지 이관이 완료되었습니다."));
    }
}

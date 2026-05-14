package com.portfolio.upload.controller;

import com.portfolio.common.ApiResponse;
import com.portfolio.upload.dto.ImageUploadResponse;
import com.portfolio.upload.service.CloudinaryUploadService;
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

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        ImageUploadResponse uploadResponse = cloudinaryUploadService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success(uploadResponse, "이미지가 업로드되었습니다."));
    }
}

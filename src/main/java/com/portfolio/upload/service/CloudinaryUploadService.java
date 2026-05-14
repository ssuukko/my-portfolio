package com.portfolio.upload.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.upload.dto.ImageUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CloudinaryUploadService {

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final String DEFAULT_ASSET_FOLDER = "my-portfolio/images";

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String assetFolder;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public CloudinaryUploadService(
            @Value("${cloudinary.cloud-name:dfbuk74qp}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.asset-folder:" + DEFAULT_ASSET_FOLDER + "}") String assetFolder,
            ObjectMapper objectMapper
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.assetFolder = assetFolder;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
    }

    public ImageUploadResponse uploadImage(MultipartFile file) throws IOException {
        validateConfig();
        validateImage(file);

        String filename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "image" : file.getOriginalFilename());
        return uploadBytes(file.getBytes(), file.getContentType(), filename);
    }

    public ImageUploadResponse uploadDataUrl(String dataUrl, String filename) throws IOException {
        validateConfig();

        DataUrlParts dataUrlParts = parseDataUrl(dataUrl);
        if (!dataUrlParts.contentType().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 data URL만 업로드할 수 있습니다.");
        }

        if (dataUrlParts.data().length > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("이미지는 5MB 이하만 업로드할 수 있습니다.");
        }

        return uploadBytes(dataUrlParts.data(), dataUrlParts.contentType(), filename);
    }

    public boolean isDataImageUrl(String value) {
        return value != null && value.regionMatches(true, 0, "data:image/", 0, 11);
    }

    private ImageUploadResponse uploadBytes(
            byte[] fileBytes,
            String contentType,
            String filename
    ) throws IOException {
        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> fields = Map.of(
                "asset_folder", assetFolder,
                "timestamp", String.valueOf(timestamp),
                "api_key", apiKey,
                "signature", createSignature(assetFolder, timestamp)
        );

        String boundary = "----portfolio-cloudinary-" + UUID.randomUUID();
        byte[] body = createMultipartBody(boundary, fields, fileBytes, contentType, filename);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode responseJson = objectMapper.readTree(response.body());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = responseJson.path("error").path("message").asText("Cloudinary 업로드에 실패했습니다.");
                throw new IllegalStateException(message);
            }

            return new ImageUploadResponse(
                    responseJson.path("secure_url").asText(),
                    responseJson.path("public_id").asText()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Cloudinary 업로드가 중단되었습니다.", exception);
        }
    }

    private void validateConfig() {
        if (
                !StringUtils.hasText(cloudName) ||
                !StringUtils.hasText(apiKey) ||
                !StringUtils.hasText(apiSecret)
        ) {
            throw new IllegalStateException("Cloudinary 설정이 필요합니다.");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("이미지 파일은 필수입니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("이미지는 5MB 이하만 업로드할 수 있습니다.");
        }
    }

    private String createSignature(String assetFolder, long timestamp) {
        String payload = "asset_folder=" + assetFolder + "&timestamp=" + timestamp + apiSecret;

        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(messageDigest.digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-1 서명 생성에 실패했습니다.", exception);
        }
    }

    private byte[] createMultipartBody(
            String boundary,
            Map<String, String> fields,
            byte[] fileBytes,
            String contentType,
            String filename
    ) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        for (Map.Entry<String, String> field : fields.entrySet()) {
            writePart(outputStream, boundary, field.getKey(), field.getValue());
        }

        String cleanFilename = StringUtils.cleanPath(filename == null || filename.isBlank() ? "image" : filename);
        outputStream.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        outputStream.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + cleanFilename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        outputStream.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        outputStream.write(fileBytes);
        outputStream.write("\r\n".getBytes(StandardCharsets.UTF_8));
        outputStream.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        return outputStream.toByteArray();
    }

    private void writePart(
            ByteArrayOutputStream outputStream,
            String boundary,
            String name,
            String value
    ) throws IOException {
        List<String> lines = List.of(
                "--" + boundary,
                "Content-Disposition: form-data; name=\"" + name + "\"",
                "",
                value
        );

        outputStream.write((String.join("\r\n", lines) + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private DataUrlParts parseDataUrl(String dataUrl) {
        if (dataUrl == null || !dataUrl.regionMatches(true, 0, "data:", 0, 5)) {
            throw new IllegalArgumentException("data URL 형식이 아닙니다.");
        }

        int commaIndex = dataUrl.indexOf(',');
        if (commaIndex < 0) {
            throw new IllegalArgumentException("data URL 형식이 아닙니다.");
        }

        String metadata = dataUrl.substring(5, commaIndex);
        if (!metadata.toLowerCase().contains(";base64")) {
            throw new IllegalArgumentException("base64 data URL만 업로드할 수 있습니다.");
        }

        String contentType = metadata.substring(0, metadata.indexOf(';'));
        byte[] data = Base64.getDecoder().decode(dataUrl.substring(commaIndex + 1));
        return new DataUrlParts(contentType, data);
    }

    private record DataUrlParts(String contentType, byte[] data) {
    }
}

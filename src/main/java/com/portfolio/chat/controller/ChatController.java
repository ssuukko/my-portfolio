package com.portfolio.chat.controller;

import com.portfolio.chat.service.ChatLogService;
import com.portfolio.chat.service.PortfolioAssistant;
import com.portfolio.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api")
public class ChatController {

    private final PortfolioAssistant portfolioAssistant;
    private final ChatLogService chatLogService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<String>> chat(
            @Valid @RequestBody ChatRequest request
    ) {
        try {
            String answer = portfolioAssistant.chat(request.message());
            chatLogService.saveSuccess(request.message(), answer);
            return ResponseEntity.ok(ApiResponse.success(answer, "챗봇 응답 생성에 성공했습니다."));
        } catch (Exception exception) {
            chatLogService.saveFail(request.message(), exception.getMessage());
            throw exception;
        }
    }

    public record ChatRequest(
            @NotBlank(message = "메시지는 필수입니다.")
            String message
    ) {
    }
}

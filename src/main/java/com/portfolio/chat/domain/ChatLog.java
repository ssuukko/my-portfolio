package com.portfolio.chat.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatLog {

    private Long id;
    private String question;
    private String answer;
    private String successYn;
    private String errorMessage;
    private LocalDateTime createdAt;

    private ChatLog(
            String question,
            String answer,
            String successYn,
            String errorMessage
    ) {
        this.question = question;
        this.answer = answer;
        this.successYn = successYn;
        this.errorMessage = errorMessage;
        this.createdAt = LocalDateTime.now();
    }

    public static ChatLog success(String question, String answer) {
        return new ChatLog(question, answer, "Y", null);
    }

    public static ChatLog fail(String question, String errorMessage) {
        return new ChatLog(question, null, "N", errorMessage);
    }
}

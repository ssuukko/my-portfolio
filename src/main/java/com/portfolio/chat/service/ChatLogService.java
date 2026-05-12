package com.portfolio.chat.service;

public interface ChatLogService {

    void saveSuccess(String question, String answer);

    void saveFail(String question, String errorMessage);
}

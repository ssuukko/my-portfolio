package com.portfolio.chat.service;

import com.portfolio.chat.domain.ChatLog;
import com.portfolio.chat.mapper.ChatLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatLogServiceImpl implements ChatLogService {

    private final ChatLogMapper chatLogMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveSuccess(String question, String answer) {
        save(ChatLog.success(question, answer));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveFail(String question, String errorMessage) {
        save(ChatLog.fail(question, errorMessage));
    }

    private void save(ChatLog chatLog) {
        try {
            chatLogMapper.save(chatLog);
        } catch (Exception exception) {
            log.warn("Failed to save chat log: {}", exception.getMessage());
        }
    }
}

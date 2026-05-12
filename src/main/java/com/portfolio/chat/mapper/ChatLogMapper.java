package com.portfolio.chat.mapper;

import com.portfolio.chat.domain.ChatLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatLogMapper {

    void save(ChatLog chatLog);
}

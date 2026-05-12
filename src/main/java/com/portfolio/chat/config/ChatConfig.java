package com.portfolio.chat.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatConfig {

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore(
            @Value("${pinecone.api-key}") String pineconeApiKey,
            @Value("${pinecone.index-name}") String pineconeIndexName
    ) {
        return PineconeEmbeddingStore.builder()
                .apiKey(pineconeApiKey)
                .index(pineconeIndexName)
                .build();
    }
}

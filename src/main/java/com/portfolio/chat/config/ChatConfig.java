package com.portfolio.chat.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class ChatConfig {

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore(
            @Value("${pinecone.api-key}") String pineconeApiKey,
            @Value("${pinecone.index-name}") String pineconeIndexName
    ) {
        try {
            return PineconeEmbeddingStore.builder()
                    .apiKey(pineconeApiKey)
                    .index(pineconeIndexName)
                    .build();
        } catch (Exception exception) {
            log.warn("Failed to initialize Pinecone embedding store. Falling back to in-memory store: {}",
                    exception.getMessage());
            return new InMemoryEmbeddingStore<>();
        }
    }
}

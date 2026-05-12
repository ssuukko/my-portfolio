package com.portfolio.chat.service;

import com.portfolio.project.domain.Project;
import com.portfolio.project.mapper.ProjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatDataInitializer {

    private final ProjectMapper projectMapper;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final PineconeProjectSyncService pineconeProjectSyncService;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void initialize() {
        try {
            initializePinecone();
        } catch (Exception exception) {
            log.warn("Chat embedding initialization skipped: {}", exception.getMessage(), exception);
        }
    }

    private void initializePinecone() {
        List<Project> projects = projectMapper.findAll();

        if (!isPineconeIndexEmpty()) {
            pineconeProjectSyncService.refreshPortfolioSummary();
            log.info("Pinecone index already contains portfolio embeddings. Refreshed portfolio summary and skipped initial project load.");
            return;
        }

        if (projects.isEmpty()) {
            log.info("No project data found for chat embedding initialization.");
            return;
        }

        pineconeProjectSyncService.initializeAll(projects);
        log.info("Initialized Pinecone embedding store with {} project segments.", projects.size());
    }

    private boolean isPineconeIndexEmpty() {
        TextSegment probeSegment = TextSegment.from("포트폴리오 프로젝트");
        Embedding probeEmbedding = embeddingModel.embed(probeSegment).content();

        return embeddingStore.findRelevant(probeEmbedding, 1).isEmpty();
    }
}

package com.portfolio.chat.service;

import com.portfolio.project.domain.Project;
import com.portfolio.project.mapper.ProjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PineconeProjectSyncService {

    public static final String PORTFOLIO_SUMMARY_VECTOR_ID = "portfolio-summary";

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final ProjectChatDocumentConverter projectChatDocumentConverter;
    private final ProjectMapper projectMapper;

    @Async
    public void upsert(Project project) {
        try {
            upsertProjectVector(project);
            refreshPortfolioSummary();
        } catch (Exception exception) {
            log.warn("Failed to sync project to Pinecone. projectId={}, message={}", project.getId(), exception.getMessage());
        }
    }

    @Async
    public void initializeAll(List<Project> projects) {
        try {
            projects.forEach(this::upsertProjectVector);
            refreshPortfolioSummary(projects);
        } catch (Exception exception) {
            log.warn("Failed to initialize Pinecone project documents: {}", exception.getMessage());
        }
    }

    private void upsertProjectVector(Project project) {
        if (project.getId() == null) {
            throw new IllegalArgumentException("Pinecone 동기화를 위한 프로젝트 id가 필요합니다.");
        }

        String vectorId = project.getId().toString();
        TextSegment segment = projectChatDocumentConverter.toTextSegment(project);
        Embedding embedding = embeddingModel.embed(segment).content();

        removeVector(vectorId);
        embeddingStore.add(vectorId, embedding);
    }

    @Async
    public void delete(Long projectId) {
        if (projectId == null) {
            return;
        }

        try {
            removeVector(projectId.toString());
            refreshPortfolioSummary();
        } catch (Exception exception) {
            log.warn("Failed to delete project from Pinecone. projectId={}, message={}", projectId, exception.getMessage());
        }
    }

    @Async
    public void refreshPortfolioSummary() {
        try {
            refreshPortfolioSummary(projectMapper.findAll());
        } catch (Exception exception) {
            log.warn("Failed to refresh Pinecone portfolio summary: {}", exception.getMessage());
        }
    }

    private void refreshPortfolioSummary(List<Project> projects) {
        TextSegment summarySegment = projectChatDocumentConverter.toPortfolioSummarySegment(projects);
        Embedding summaryEmbedding = embeddingModel.embed(summarySegment).content();

        removeVector(PORTFOLIO_SUMMARY_VECTOR_ID);
        embeddingStore.add(PORTFOLIO_SUMMARY_VECTOR_ID, summaryEmbedding);
    }

    private void removeVector(String vectorId) {
        try {
            embeddingStore.removeAll(List.of(vectorId));
        } catch (StatusRuntimeException exception) {
            if (exception.getStatus().getCode() == Status.Code.NOT_FOUND) {
                log.debug("Pinecone vector delete skipped because namespace or vector was not found. vectorId={}", vectorId);
                return;
            }

            throw exception;
        }
    }
}

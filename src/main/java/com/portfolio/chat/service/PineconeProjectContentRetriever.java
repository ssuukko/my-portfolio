package com.portfolio.chat.service;

import com.portfolio.project.mapper.ProjectMapper;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class PineconeProjectContentRetriever implements ContentRetriever {

    private static final int MAX_RESULTS = 3;
    private static final double MIN_SCORE = 0.6;

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final ProjectMapper projectMapper;
    private final ProjectChatDocumentConverter projectChatDocumentConverter;

    @Override
    public List<Content> retrieve(Query query) {
        Embedding queryEmbedding = embeddingModel.embed(query.text()).content();

        return embeddingStore.findRelevant(queryEmbedding, MAX_RESULTS, MIN_SCORE)
                .stream()
                .map(EmbeddingMatch::embeddingId)
                .flatMap(this::findContentSegment)
                .map(Content::from)
                .toList();
    }

    private Stream<TextSegment> findContentSegment(String embeddingId) {
        if (PineconeProjectSyncService.PORTFOLIO_SUMMARY_VECTOR_ID.equals(embeddingId)) {
            return Stream.of(projectChatDocumentConverter.toPortfolioSummarySegment(projectMapper.findAll()));
        }

        return projectMapper.findById(parseProjectId(embeddingId))
                .map(projectChatDocumentConverter::toTextSegment)
                .stream();
    }

    private Long parseProjectId(String embeddingId) {
        try {
            return Long.parseLong(embeddingId);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Pinecone vector id가 프로젝트 id 형식이 아닙니다. id=" + embeddingId);
        }
    }
}

package com.portfolio.visit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.portfolio.visit.domain.Visit;
import com.portfolio.visit.dto.VisitCreateRequest;
import com.portfolio.visit.mapper.VisitMapper;

@ExtendWith(MockitoExtension.class)
class VisitServiceImplTest {

    @Mock
    private VisitMapper visitMapper;

    @InjectMocks
    private VisitServiceImpl visitService;

    @Test
    void createVisit_doesNotSaveLocalhostPageVisit() {
        VisitCreateRequest request = new VisitCreateRequest("http://localhost:5173/", null, null);

        Long visitId = visitService.createVisit(request, "203.0.113.10", "test-agent");

        assertThat(visitId).isNull();
        verify(visitMapper, never()).save(any(Visit.class));
    }

    @Test
    void createVisit_doesNotSaveOwnerIpVisit() {
        VisitCreateRequest request = new VisitCreateRequest("https://example.com/", null, null);

        Long visitId = visitService.createVisit(request, "1.222.116.10", "test-agent");

        assertThat(visitId).isNull();
        verify(visitMapper, never()).save(any(Visit.class));
    }
}

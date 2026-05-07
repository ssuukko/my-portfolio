package com.portfolio.visit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portfolio.visit.domain.Visit;
import com.portfolio.visit.dto.VisitCreateRequest;
import com.portfolio.visit.dto.VisitResponse;
import com.portfolio.visit.mapper.VisitMapper;

import java.util.List;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VisitServiceImpl implements VisitService {

    private final VisitMapper visitMapper;

    @Override
    @Transactional
    public Long createVisit(VisitCreateRequest request, String ipAddress, String userAgent) {
        Visit visit = request.toVisit(ipAddress, userAgent);
        visitMapper.save(visit);
        return visit.getId();
    }

    @Override
    public List<VisitResponse> getRecentVisits() {
        return visitMapper.findRecent()
                .stream()
                .map(VisitResponse::from)
                .toList();
    }
}

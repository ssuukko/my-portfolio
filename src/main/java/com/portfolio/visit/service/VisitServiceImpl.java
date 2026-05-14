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

    private static final String EXCLUDED_LOCAL_PAGE_URL = "http://localhost:5173/";
    private static final String EXCLUDED_OWNER_IP_ADDRESS = "1.222.116.10";

    private final VisitMapper visitMapper;

    @Override
    @Transactional
    public Long createVisit(VisitCreateRequest request, String ipAddress, String userAgent) {
        if (isExcludedVisit(request, ipAddress)) {
            return null;
        }

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

    private boolean isExcludedVisit(VisitCreateRequest request, String ipAddress) {
        return EXCLUDED_LOCAL_PAGE_URL.equals(request.pageUrl())
                || EXCLUDED_OWNER_IP_ADDRESS.equals(ipAddress);
    }
}

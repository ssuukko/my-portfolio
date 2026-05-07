package com.portfolio.visit.service;

import com.portfolio.visit.dto.VisitCreateRequest;
import com.portfolio.visit.dto.VisitResponse;

import java.util.List;

public interface VisitService {

    Long createVisit(VisitCreateRequest request, String ipAddress, String userAgent);

    List<VisitResponse> getRecentVisits();
}

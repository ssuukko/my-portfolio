package com.portfolio.visit.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.portfolio.visit.domain.Visit;

import java.util.List;

@Mapper
public interface VisitMapper {

    void save(Visit visit);

    List<Visit> findRecent();
}

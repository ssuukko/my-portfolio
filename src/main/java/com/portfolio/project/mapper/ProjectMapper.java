package com.portfolio.project.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.portfolio.project.domain.Project;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProjectMapper {

    void save(Project project);

    Optional<Project> findById(Long id);

    List<Project> findAll();

    void update(Project project);

    void deleteById(Long id);
}

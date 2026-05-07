package com.portfolio.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.portfolio.project.domain.Project;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProjectMapper {

    void save(Project project);

    Optional<Project> findById(Long id);

    List<Project> findAll();

    Integer findNextDisplayOrder();

    void update(Project project);

    void updateDisplayOrder(
            @Param("id") Long id,
            @Param("displayOrder") Integer displayOrder
    );

    void deleteById(Long id);
}

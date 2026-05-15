package com.portfolio.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.portfolio.project.domain.Project;
import com.portfolio.project.domain.ProjectTrouble;
import com.portfolio.project.domain.ProjectTroubleSolution;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProjectMapper {

    void save(Project project);

    Optional<Project> findById(Long id);

    List<Project> findAll();

    Optional<Project> findAttachmentById(Long id);

    List<Project> findSummaries();

    Integer findNextDisplayOrder();

    void update(Project project);

    List<ProjectTrouble> findTroublesByProjectId(@Param("projectId") Long projectId);

    List<ProjectTroubleSolution> findTroubleSolutionsByProjectId(@Param("projectId") Long projectId);

    void insertTrouble(ProjectTrouble trouble);

    void insertTroubleSolution(ProjectTroubleSolution solution);

    void updateTroubleSelectedSolution(
            @Param("id") Long id,
            @Param("selectedSolutionId") Long selectedSolutionId
    );

    void deleteTroublesByProjectId(@Param("projectId") Long projectId);

    void updateDisplayOrder(
            @Param("id") Long id,
            @Param("displayOrder") Integer displayOrder
    );

    void updateAttachment(Project project);

    void deleteAttachment(Long id);

    void deleteById(Long id);
}

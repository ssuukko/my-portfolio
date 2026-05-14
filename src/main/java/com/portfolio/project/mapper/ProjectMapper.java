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

    Optional<Project> findAttachmentById(Long id);

    List<Project> findSummaries();

    Integer findNextDisplayOrder();

    void update(Project project);

    void updateImages(
            @Param("id") Long id,
            @Param("thumbnailUrl") String thumbnailUrl,
            @Param("featureImageUrls") String featureImageUrls
    );

    void updateDisplayOrder(
            @Param("id") Long id,
            @Param("displayOrder") Integer displayOrder
    );

    void updateAttachment(Project project);

    void deleteAttachment(Long id);

    void deleteById(Long id);
}

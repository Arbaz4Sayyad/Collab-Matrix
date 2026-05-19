package com.collab.workspace.repository;

import com.collab.workspace.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByWorkspaceId(UUID workspaceId);
    boolean existsByWorkspaceIdAndKey(UUID workspaceId, String key);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Project p WHERE p.workspaceId = :workspaceId AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Project> searchProjectsByKeyword(UUID workspaceId, String keyword);
}

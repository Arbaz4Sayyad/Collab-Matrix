package com.collab.workspace.service;

import com.collab.infra.provider.ProjectSearchProvider;
import com.collab.workspace.dto.ProjectRequest;
import com.collab.workspace.dto.ProjectResponse;

import java.util.List;
import java.util.UUID;

public interface ProjectService extends ProjectSearchProvider {
    ProjectResponse createProject(UUID workspaceId, ProjectRequest request);
    List<ProjectResponse> getProjectsByWorkspace(UUID workspaceId);
    ProjectResponse getProjectById(UUID projectId);
}

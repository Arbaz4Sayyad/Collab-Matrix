package com.collab.workspace.service;

import com.collab.workspace.dto.WorkspaceRequest;
import com.collab.workspace.dto.WorkspaceResponse;

import java.util.List;
import java.util.UUID;

public interface WorkspaceService {
    WorkspaceResponse createWorkspace(WorkspaceRequest request, UUID ownerId);
    WorkspaceResponse getWorkspaceById(UUID workspaceId);
    List<WorkspaceResponse> getWorkspacesForUser(UUID userId);
    void addMemberToWorkspace(UUID workspaceId, UUID userId, String role);
    boolean isUserMemberOfWorkspace(UUID workspaceId, UUID userId);
}

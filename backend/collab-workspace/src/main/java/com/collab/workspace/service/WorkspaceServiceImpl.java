package com.collab.workspace.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.workspace.domain.Workspace;
import com.collab.workspace.domain.WorkspaceMember;
import com.collab.workspace.dto.WorkspaceRequest;
import com.collab.workspace.dto.WorkspaceResponse;
import com.collab.workspace.repository.WorkspaceMemberRepository;
import com.collab.workspace.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkspaceServiceImpl implements WorkspaceService {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Override
    public WorkspaceResponse createWorkspace(WorkspaceRequest request, UUID ownerId) {
        if (workspaceRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("Workspace slug is already taken");
        }

        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .ownerId(ownerId)
                .build();

        workspace = workspaceRepository.save(workspace);

        // Add owner as default WORKSPACE_OWNER member
        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspaceId(workspace.getId())
                .userId(ownerId)
                .role("OWNER")
                .build();
        workspaceMemberRepository.save(ownerMember);

        return mapToResponse(workspace);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(UUID workspaceId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found with id: " + workspaceId));
        return mapToResponse(workspace);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getWorkspacesForUser(UUID userId) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserId(userId);
        List<UUID> workspaceIds = memberships.stream()
                .map(WorkspaceMember::getWorkspaceId)
                .collect(Collectors.toList());

        return workspaceRepository.findAllById(workspaceIds).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void addMemberToWorkspace(UUID workspaceId, UUID userId, String role) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new IllegalArgumentException("User is already a member of this workspace");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(userId)
                .role(role)
                .build();
        workspaceMemberRepository.save(member);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserMemberOfWorkspace(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }

    private WorkspaceResponse mapToResponse(Workspace workspace) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .ownerId(workspace.getOwnerId())
                .createdAt(workspace.getCreatedAt())
                .build();
    }
}

package com.collab.workspace.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.workspace.dto.WorkspaceRequest;
import com.collab.workspace.dto.WorkspaceResponse;
import com.collab.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workspaces")
public class WorkspaceController {

    @Autowired
    private WorkspaceService workspaceService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
            @Valid @RequestBody WorkspaceRequest request,
            @RequestAttribute("userId") String userId) {
        
        WorkspaceResponse response = workspaceService.createWorkspace(request, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(response, "Workspace created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces(
            @RequestAttribute("userId") String userId) {
        
        List<WorkspaceResponse> response = workspaceService.getWorkspacesForUser(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(response, "Workspaces retrieved successfully"));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<Void>> addMember(
            @PathVariable("id") UUID workspaceId,
            @RequestParam("memberId") UUID memberId,
            @RequestParam(value = "role", defaultValue = "MEMBER") String role,
            @RequestAttribute("userId") String userId) {
        
        // Simple security check: verify requester is indeed a member of the workspace
        if (!workspaceService.isUserMemberOfWorkspace(workspaceId, UUID.fromString(userId))) {
            throw new IllegalArgumentException("You are not authorized to invite members to this workspace");
        }

        workspaceService.addMemberToWorkspace(workspaceId, memberId, role);
        return ResponseEntity.ok(ApiResponse.success(null, "Member added to workspace successfully"));
    }
}

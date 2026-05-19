package com.collab.workspace.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.workspace.dto.ProjectRequest;
import com.collab.workspace.dto.ProjectResponse;
import com.collab.workspace.service.ProjectService;
import com.collab.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workspaces/{workspaceId}/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private WorkspaceService workspaceService;

    private void verifyWorkspaceMembership(UUID workspaceId, String userId) {
        if (!workspaceService.isUserMemberOfWorkspace(workspaceId, UUID.fromString(userId))) {
            throw new IllegalArgumentException("You are not a member of this workspace");
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @PathVariable("workspaceId") UUID workspaceId,
            @Valid @RequestBody ProjectRequest request,
            @RequestAttribute("userId") String userId) {
        
        verifyWorkspaceMembership(workspaceId, userId);
        ProjectResponse response = projectService.createProject(workspaceId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Project created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getWorkspaceProjects(
            @PathVariable("workspaceId") UUID workspaceId,
            @RequestAttribute("userId") String userId) {
        
        verifyWorkspaceMembership(workspaceId, userId);
        List<ProjectResponse> response = projectService.getProjectsByWorkspace(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response, "Projects retrieved successfully"));
    }
}

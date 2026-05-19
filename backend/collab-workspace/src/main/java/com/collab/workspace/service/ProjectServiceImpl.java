package com.collab.workspace.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.workspace.domain.Project;
import com.collab.workspace.dto.ProjectRequest;
import com.collab.workspace.dto.ProjectResponse;
import com.collab.workspace.repository.ProjectRepository;
import com.collab.workspace.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Override
    public ProjectResponse createProject(UUID workspaceId, ProjectRequest request) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        if (projectRepository.existsByWorkspaceIdAndKey(workspaceId, request.getKey())) {
            throw new IllegalArgumentException("Project key already exists in this workspace");
        }

        Project project = Project.builder()
                .workspaceId(workspaceId)
                .name(request.getName())
                .key(request.getKey().toUpperCase())
                .description(request.getDescription())
                .build();

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByWorkspace(UUID workspaceId) {
        if (!workspaceRepository.existsById(workspaceId)) {
            throw new ResourceNotFoundException("Workspace not found with id: " + workspaceId);
        }
        return projectRepository.findByWorkspaceId(workspaceId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        return mapToResponse(project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> searchProjects(UUID workspaceId, String keyword) {
        return projectRepository.searchProjectsByKeyword(workspaceId, keyword).stream()
                .map(p -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", p.getId().toString());
                    map.put("name", p.getName());
                    map.put("key", p.getKey());
                    map.put("description", p.getDescription());
                    map.put("type", "PROJECT");
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getProjectIdsByWorkspace(UUID workspaceId) {
        return projectRepository.findByWorkspaceId(workspaceId).stream()
                .map(Project::getId)
                .collect(Collectors.toList());
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspaceId())
                .name(project.getName())
                .key(project.getKey())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .build();
    }
}

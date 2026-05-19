package com.collab.task.service;

import com.collab.infra.provider.TaskSearchProvider;
import com.collab.task.dto.TaskRequest;
import com.collab.task.dto.TaskResponse;

import java.util.List;
import java.util.UUID;

public interface TaskService extends TaskSearchProvider {
    TaskResponse createTask(UUID projectId, TaskRequest request, UUID reporterId);
    List<TaskResponse> getTasksByProject(UUID projectId);
    TaskResponse getTaskById(UUID taskId);
    TaskResponse updateTask(UUID taskId, TaskRequest request);
    TaskResponse updateTaskStatus(UUID taskId, String status, Long currentVersion);
}

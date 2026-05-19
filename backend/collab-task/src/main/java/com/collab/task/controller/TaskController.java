package com.collab.task.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.task.dto.TaskRequest;
import com.collab.task.dto.TaskResponse;
import com.collab.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable("projectId") UUID projectId,
            @Valid @RequestBody TaskRequest request,
            @RequestAttribute("userId") String reporterId) {
        
        TaskResponse response = taskService.createTask(projectId, request, UUID.fromString(reporterId));
        return ResponseEntity.ok(ApiResponse.success(response, "Task created successfully"));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectTasks(
            @PathVariable("projectId") UUID projectId) {
        
        List<TaskResponse> response = taskService.getTasksByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Tasks retrieved successfully"));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskDetails(
            @PathVariable("id") UUID taskId) {
        
        TaskResponse response = taskService.getTaskById(taskId);
        return ResponseEntity.ok(ApiResponse.success(response, "Task details retrieved successfully"));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable("id") UUID taskId,
            @Valid @RequestBody TaskRequest request) {
        
        TaskResponse response = taskService.updateTask(taskId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Task updated successfully"));
    }

    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable("id") UUID taskId,
            @RequestParam("status") String status,
            @RequestParam("version") Long version) {
        
        TaskResponse response = taskService.updateTaskStatus(taskId, status, version);
        return ResponseEntity.ok(ApiResponse.success(response, "Task status updated successfully (Optimistic Lock Succeeded)"));
    }
}

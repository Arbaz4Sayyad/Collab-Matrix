package com.collab.task.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.events.TaskEvent;
import com.collab.task.domain.Task;
import com.collab.task.dto.TaskRequest;
import com.collab.task.dto.TaskResponse;
import com.collab.task.repository.TaskRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TASK_EVENTS_TOPIC = "workspace.task.events";

    @Override
    public TaskResponse createTask(UUID projectId, TaskRequest request, UUID reporterId) {
        Task task = Task.builder()
                .projectId(projectId)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .assigneeId(request.getAssigneeId())
                .reporterId(reporterId)
                .build();

        task = taskRepository.save(task);
        publishTaskEvent("CREATED", task);

        return mapToResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        return mapToResponse(task);
    }

    @Override
    public TaskResponse updateTask(UUID taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setPriority(request.getPriority());
        task.setAssigneeId(request.getAssigneeId());

        task = taskRepository.save(task);
        publishTaskEvent("UPDATED", task);

        return mapToResponse(task);
    }

    @Override
    public TaskResponse updateTaskStatus(UUID taskId, String status, Long currentVersion) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        // Enforce optimistic locking check manually if version mismatch
        if (!task.getVersion().equals(currentVersion)) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        task.setStatus(status);
        task = taskRepository.save(task);
        publishTaskEvent("STATUS_CHANGED", task);

        return mapToResponse(task);
    }

    private void publishTaskEvent(String eventType, Task task) {
        if (kafkaTemplate == null) {
            log.warn("KafkaTemplate is not configured. Skipping event emission.");
            return;
        }

        try {
            TaskEvent event = TaskEvent.builder()
                    .eventType(eventType)
                    .taskId(task.getId())
                    .projectId(task.getProjectId())
                    .title(task.getTitle())
                    .status(task.getStatus())
                    .assigneeId(task.getAssigneeId())
                    .reporterId(task.getReporterId())
                    .build();

            // Hash partition by projectId to preserve ordering per project Agile board
            kafkaTemplate.send(TASK_EVENTS_TOPIC, task.getProjectId().toString(), event);
            log.info("Successfully published TaskEvent [{}] for task id: {}", eventType, task.getId());
        } catch (Exception e) {
            log.error("Failed to publish TaskEvent to Kafka due to network/broker errors: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> searchTasks(UUID projectId, String keyword) {
        return taskRepository.searchTasksByKeyword(projectId, keyword).stream()
                .map(t -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", t.getId().toString());
                    map.put("title", t.getTitle());
                    map.put("description", t.getDescription());
                    map.put("status", t.getStatus());
                    map.put("priority", t.getPriority());
                    map.put("type", "TASK");
                    return map;
                })
                .collect(Collectors.toList());
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .assigneeId(task.getAssigneeId())
                .reporterId(task.getReporterId())
                .version(task.getVersion())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}

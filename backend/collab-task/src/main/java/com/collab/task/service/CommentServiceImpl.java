package com.collab.task.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.task.domain.TaskComment;
import com.collab.task.dto.CommentRequest;
import com.collab.task.dto.CommentResponse;
import com.collab.task.repository.TaskCommentRepository;
import com.collab.task.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {

    @Autowired
    private TaskCommentRepository commentRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Override
    public CommentResponse addComment(UUID taskId, CommentRequest request, UUID userId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }

        TaskComment comment = TaskComment.builder()
                .taskId(taskId)
                .userId(userId)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);
        return mapToResponse(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTask(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found with id: " + taskId);
        }

        return commentRepository.findByTaskId(taskId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(TaskComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTaskId())
                .userId(comment.getUserId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}

package com.collab.task.service;

import com.collab.task.dto.CommentRequest;
import com.collab.task.dto.CommentResponse;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    CommentResponse addComment(UUID taskId, CommentRequest request, UUID userId);
    List<CommentResponse> getCommentsByTask(UUID taskId);
}

package com.collab.task.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.task.dto.CommentRequest;
import com.collab.task.dto.CommentResponse;
import com.collab.task.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks/{taskId}/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable("taskId") UUID taskId,
            @Valid @RequestBody CommentRequest request,
            @RequestAttribute("userId") String userId) {
        
        CommentResponse response = commentService.addComment(taskId, request, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(response, "Comment added successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getTaskComments(
            @PathVariable("taskId") UUID taskId) {
        
        List<CommentResponse> response = commentService.getCommentsByTask(taskId);
        return ResponseEntity.ok(ApiResponse.success(response, "Comments retrieved successfully"));
    }
}

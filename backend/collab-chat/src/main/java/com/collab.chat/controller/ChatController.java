package com.collab.chat.controller;

import com.collab.chat.dto.MessageRequest;
import com.collab.chat.dto.MessageResponse;
import com.collab.chat.service.ChatService;
import com.collab.chat.service.PresenceService;
import com.collab.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private PresenceService presenceService;

    @PostMapping("/workspaces/{workspaceId}/chats/channel")
    public ResponseEntity<ApiResponse<MessageResponse>> postChannelMessage(
            @PathVariable("workspaceId") UUID workspaceId,
            @Valid @RequestBody MessageRequest request,
            @RequestAttribute("userId") String senderId) {
        
        MessageResponse response = chatService.saveChannelMessage(workspaceId, request, UUID.fromString(senderId));
        return ResponseEntity.ok(ApiResponse.success(response, "Channel message posted successfully"));
    }

    @PostMapping("/workspaces/{workspaceId}/chats/direct")
    public ResponseEntity<ApiResponse<MessageResponse>> postDirectMessage(
            @PathVariable("workspaceId") UUID workspaceId,
            @Valid @RequestBody MessageRequest request,
            @RequestAttribute("userId") String senderId) {
        
        MessageResponse response = chatService.saveDirectMessage(workspaceId, request, UUID.fromString(senderId));
        return ResponseEntity.ok(ApiResponse.success(response, "Direct message posted successfully"));
    }

    @GetMapping("/workspaces/{workspaceId}/chats/channel")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getChannelFeed(
            @PathVariable("workspaceId") UUID workspaceId,
            @RequestParam("channelId") String channelId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "30") int size) {
        
        List<MessageResponse> response = chatService.getChannelMessages(workspaceId, channelId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Channel feed retrieved successfully"));
    }

    @GetMapping("/workspaces/{workspaceId}/chats/direct")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getDirectChatHistory(
            @PathVariable("workspaceId") UUID workspaceId,
            @RequestParam("receiverId") UUID receiverId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "30") int size,
            @RequestAttribute("userId") String senderId) {
        
        List<MessageResponse> response = chatService.getDirectMessages(
                workspaceId, UUID.fromString(senderId), receiverId, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Direct conversation feed retrieved successfully"));
    }

    @PostMapping("/presence/heartbeat")
    public ResponseEntity<ApiResponse<Void>> heartbeat(
            @RequestAttribute("userId") String userId) {
        
        presenceService.setUserOnline(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(null, "Heartbeat registered successfully"));
    }

    @GetMapping("/presence/{userId}")
    public ResponseEntity<ApiResponse<Boolean>> getPresence(
            @PathVariable("userId") UUID userId) {
        
        boolean online = presenceService.isUserOnline(userId);
        return ResponseEntity.ok(ApiResponse.success(online, "User presence retrieved successfully"));
    }
}

package com.collab.chat.service;

import com.collab.chat.domain.ChatMessage;
import com.collab.chat.dto.MessageRequest;
import com.collab.chat.dto.MessageResponse;
import com.collab.chat.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public MessageResponse saveChannelMessage(UUID workspaceId, MessageRequest request, UUID senderId) {
        ChatMessage message = ChatMessage.builder()
                .workspaceId(workspaceId)
                .channelId(request.getChannelId())
                .senderId(senderId)
                .content(request.getContent())
                .isDirectMessage(false)
                .build();

        message = chatMessageRepository.save(message);
        MessageResponse response = mapToResponse(message);

        // Push via STOMP WebSocket
        if (messagingTemplate != null) {
            String destination = "/topic/workspace." + workspaceId + ".channels." + request.getChannelId();
            messagingTemplate.convertAndSend(destination, response);
        }

        return response;
    }

    @Override
    public MessageResponse saveDirectMessage(UUID workspaceId, MessageRequest request, UUID senderId) {
        ChatMessage message = ChatMessage.builder()
                .workspaceId(workspaceId)
                .senderId(senderId)
                .receiverId(request.getReceiverId())
                .content(request.getContent())
                .isDirectMessage(true)
                .build();

        message = chatMessageRepository.save(message);
        MessageResponse response = mapToResponse(message);

        // Push to both sender and receiver's private queue destinations
        if (messagingTemplate != null) {
            String destSender = "/queue/user." + senderId + ".direct";
            String destReceiver = "/queue/user." + request.getReceiverId() + ".direct";
            messagingTemplate.convertAndSend(destSender, response);
            messagingTemplate.convertAndSend(destReceiver, response);
        }

        return response;
    }

    @Override
    public List<MessageResponse> getChannelMessages(UUID workspaceId, String channelId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return chatMessageRepository.findByWorkspaceIdAndChannelId(workspaceId, channelId, pageable).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageResponse> getDirectMessages(UUID workspaceId, UUID userA, UUID userB, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return chatMessageRepository.findByWorkspaceIdAndIsDirectMessageAndSenderIdAndReceiverIdOrWorkspaceIdAndIsDirectMessageAndSenderIdAndReceiverId(
                workspaceId, true, userA, userB,
                workspaceId, true, userB, userA,
                pageable
        ).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private MessageResponse mapToResponse(ChatMessage msg) {
        return MessageResponse.builder()
                .id(msg.getId())
                .workspaceId(msg.getWorkspaceId())
                .channelId(msg.getChannelId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .isDirectMessage(msg.isDirectMessage())
                .receiverId(msg.getReceiverId())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}

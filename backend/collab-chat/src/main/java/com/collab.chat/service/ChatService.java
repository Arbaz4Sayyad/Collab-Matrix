package com.collab.chat.service;

import com.collab.chat.dto.MessageRequest;
import com.collab.chat.dto.MessageResponse;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    MessageResponse saveChannelMessage(UUID workspaceId, MessageRequest request, UUID senderId);
    MessageResponse saveDirectMessage(UUID workspaceId, MessageRequest request, UUID senderId);
    List<MessageResponse> getChannelMessages(UUID workspaceId, String channelId, int page, int size);
    List<MessageResponse> getDirectMessages(UUID workspaceId, UUID userA, UUID userB, int page, int size);
}

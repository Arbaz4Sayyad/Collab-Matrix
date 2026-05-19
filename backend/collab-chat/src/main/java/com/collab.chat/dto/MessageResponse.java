package com.collab.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private UUID workspaceId;
    private String channelId;
    private UUID senderId;
    private String content;
    private boolean isDirectMessage;
    private UUID receiverId;
    private LocalDateTime createdAt;
}

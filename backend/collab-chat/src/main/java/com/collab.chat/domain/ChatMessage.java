package com.collab.chat.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Document(collection = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    private String id;

    private UUID workspaceId;

    private String channelId; // null if direct message

    private UUID senderId;

    private String content;

    private boolean isDirectMessage;

    private UUID receiverId; // null if channel message

    @CreatedDate
    private LocalDateTime createdAt;
}

package com.collab.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class MessageRequest {

    @NotBlank(message = "Message content cannot be blank")
    private String content;

    private String channelId; // null if DM

    private UUID receiverId; // null if channel chat
}

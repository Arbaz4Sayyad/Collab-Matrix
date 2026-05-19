package com.collab.chat.repository;

import com.collab.chat.domain.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByWorkspaceIdAndChannelId(UUID workspaceId, String channelId, Pageable pageable);
    
    List<ChatMessage> findByWorkspaceIdAndIsDirectMessageAndSenderIdAndReceiverIdOrWorkspaceIdAndIsDirectMessageAndSenderIdAndReceiverId(
            UUID w1, boolean dm1, UUID s1, UUID r1,
            UUID w2, boolean dm2, UUID s2, UUID r2,
            Pageable pageable
    );
}

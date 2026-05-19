package com.collab.infra.websocket;

import com.collab.infra.provider.DocumentStateProvider;
import com.collab.infra.websocket.dto.RedisWebSocketMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
@Slf4j
public class YjsWebSocketHandler extends BinaryWebSocketHandler {

    @Autowired
    private DocumentStateProvider documentStateProvider;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String REDIS_CHANNEL = "collab-doc-updates";

    // Maps docId -> Set of local active WebSocket sessions
    private final Map<String, Set<WebSocketSession>> documentSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String docId = getDocId(session);
        if (docId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        documentSessions.computeIfAbsent(docId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.info("Client connected to docId: {}, Session ID: {}", docId, session.getId());

        // Send current document state vector from MongoDB if exists
        try {
            byte[] state = documentStateProvider.getDocumentState(docId);
            if (state != null && state.length > 0) {
                session.sendMessage(new BinaryMessage(state));
            }
        } catch (Exception e) {
            log.error("Failed to load initial state vector for docId: {}", docId, e);
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        String docId = getDocId(session);
        if (docId == null) return;

        ByteBuffer byteBuffer = message.getPayload();
        byte[] payloadBytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(payloadBytes);

        // 1. Broadcast locally to all OTHER sessions on this document
        broadcastLocally(docId, session.getId(), payloadBytes);

        // 2. Persist update to MongoDB asynchronously
        try {
            documentStateProvider.updateDocumentState(docId, payloadBytes);
        } catch (Exception e) {
            log.error("Failed to save state update to MongoDB for docId: {}", docId, e);
        }

        // 3. Publish to Redis Pub/Sub to scale across multi-node deployment
        try {
            RedisWebSocketMessage redisMsg = RedisWebSocketMessage.builder()
                    .docId(docId)
                    .senderSessionId(session.getId())
                    .payloadBase64(Base64.getEncoder().encodeToString(payloadBytes))
                    .build();
            redisTemplate.convertAndSend(REDIS_CHANNEL, redisMsg);
        } catch (Exception e) {
            log.error("Failed to publish document update to Redis for doc: {}", docId, e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String docId = getDocId(session);
        if (docId != null) {
            Set<WebSocketSession> sessions = documentSessions.get(docId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    documentSessions.remove(docId);
                }
            }
        }
        log.info("Client disconnected from session ID: {}", session.getId());
    }

    public void handleRedisBroadcast(String docId, String senderSessionId, byte[] payload) {
        // Broadcast to local sessions, ignoring the one that sent it if it is hosted on this node
        broadcastLocally(docId, senderSessionId, payload);
    }

    private void broadcastLocally(String docId, String excludeSessionId, byte[] payload) {
        Set<WebSocketSession> sessions = documentSessions.getOrDefault(docId, Collections.emptySet());
        for (WebSocketSession session : sessions) {
            if (session.isOpen() && !session.getId().equals(excludeSessionId)) {
                try {
                    session.sendMessage(new BinaryMessage(payload));
                } catch (IOException e) {
                    log.error("Failed to broadcast message to session: {}", session.getId(), e);
                }
            }
        }
    }

    private String getDocId(WebSocketSession session) {
        String path = session.getUri().getPath();
        // Expected format: /ws/docs/{docId}
        String[] parts = path.split("/");
        if (parts.length >= 4) {
            return parts[3];
        }
        return null;
    }
}

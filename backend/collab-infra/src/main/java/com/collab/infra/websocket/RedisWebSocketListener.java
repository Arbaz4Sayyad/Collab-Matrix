package com.collab.infra.websocket;

import com.collab.infra.websocket.dto.RedisWebSocketMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.util.Base64;

@Component
@Slf4j
public class RedisWebSocketListener implements MessageListener {

    @Autowired
    private YjsWebSocketHandler webSocketHandler;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            // Redis pub/sub messages published via RedisTemplate are serialized.
            // Let's extract the body and map it.
            byte[] body = message.getBody();
            // Spring RedisTemplate by default prepends class type markers or uses JSON serialization.
            // We can cleanly parse the body string as JSON.
            // If body starts with quotes or contains JSON, let's strip any extra serialized headers or parse directly.
            String bodyStr = new String(body);
            
            // Clean up serialized Java string wrappers if present in Redis stream
            if (bodyStr.startsWith("\"") && bodyStr.endsWith("\"")) {
                bodyStr = objectMapper.readValue(bodyStr, String.class);
            }

            RedisWebSocketMessage msg = objectMapper.readValue(bodyStr, RedisWebSocketMessage.class);
            byte[] payloadBytes = Base64.getDecoder().decode(msg.getPayloadBase64());

            webSocketHandler.handleRedisBroadcast(msg.getDocId(), msg.getSenderSessionId(), payloadBytes);
        } catch (Exception e) {
            log.error("Failed to parse and handle Redis broadcasted websocket update", e);
        }
    }
}

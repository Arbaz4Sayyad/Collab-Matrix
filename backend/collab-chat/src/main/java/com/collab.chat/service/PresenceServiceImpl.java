package com.collab.chat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class PresenceServiceImpl implements PresenceService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String PRESENCE_KEY_PREFIX = "presence:user:";
    private static final long PRESENCE_TTL_SECONDS = 60;

    @Override
    public void setUserOnline(UUID userId) {
        String key = PRESENCE_KEY_PREFIX + userId.toString();
        redisTemplate.opsForValue().set(key, "online", PRESENCE_TTL_SECONDS, TimeUnit.SECONDS);
    }

    @Override
    public void setUserOffline(UUID userId) {
        String key = PRESENCE_KEY_PREFIX + userId.toString();
        redisTemplate.delete(key);
    }

    @Override
    public boolean isUserOnline(UUID userId) {
        String key = PRESENCE_KEY_PREFIX + userId.toString();
        Object status = redisTemplate.opsForValue().get(key);
        return status != null && status.toString().equals("online");
    }
}

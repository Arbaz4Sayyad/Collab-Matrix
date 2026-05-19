package com.collab.chat.service;

import java.util.UUID;

public interface PresenceService {
    void setUserOnline(UUID userId);
    void setUserOffline(UUID userId);
    boolean isUserOnline(UUID userId);
}

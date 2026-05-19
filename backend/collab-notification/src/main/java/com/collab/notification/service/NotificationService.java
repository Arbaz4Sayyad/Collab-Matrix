package com.collab.notification.service;

import com.collab.notification.dto.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<NotificationResponse> getNotificationsForUser(UUID userId);
    void markAsRead(UUID notificationId);
    NotificationResponse createAndSendNotification(UUID userId, String title, String message);
}

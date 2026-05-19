package com.collab.notification.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.notification.domain.Notification;
import com.collab.notification.dto.NotificationResponse;
import com.collab.notification.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public NotificationResponse createAndSendNotification(UUID userId, String title, String message) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .read(false)
                .build();

        notification = notificationRepository.save(notification);
        NotificationResponse response = mapToResponse(notification);

        // Push real-time STOMP notification to the user's private queue
        if (messagingTemplate != null) {
            String destination = "/queue/user." + userId.toString() + ".notifications";
            try {
                messagingTemplate.convertAndSend(destination, response);
                log.info("Pushed STOMP notification successfully to: {}", destination);
            } catch (Exception e) {
                log.error("Failed to push STOMP notification: {}", e.getMessage());
            }
        }

        return response;
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

package com.collab.notification.kafka;

import com.collab.events.TaskEvent;
import com.collab.notification.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class TaskEventConsumer {

    @Autowired
    private NotificationService notificationService;

    @KafkaListener(
            topics = "workspace.task.events",
            groupId = "collab-notification-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeTaskEvent(TaskEvent event) {
        log.info("Consumed Kafka TaskEvent: [{}] for task: {}", event.getEventType(), event.getTaskId());

        try {
            // Send notification to the assignee if defined
            if (event.getAssigneeId() != null) {
                String title = "Task " + event.getEventType().toLowerCase();
                String message = String.format("Task '%s' was %s. Status: %s.", 
                        event.getTitle(), event.getEventType().toLowerCase(), event.getStatus());

                notificationService.createAndSendNotification(
                        event.getAssigneeId(), title, message);
                
                log.info("Successfully processed Kafka notification for assignee: {}", event.getAssigneeId());
            }

            // Also notify the reporter if the status was changed by someone else
            if (event.getReporterId() != null && !event.getReporterId().equals(event.getAssigneeId())) {
                String title = "Task Status Updated";
                String message = String.format("Your reported task '%s' status is now: %s.", 
                        event.getTitle(), event.getStatus());

                notificationService.createAndSendNotification(
                        event.getReporterId(), title, message);
                
                log.info("Successfully processed Kafka notification for reporter: {}", event.getReporterId());
            }
        } catch (Exception e) {
            log.error("Error processing consumed TaskEvent", e);
        }
    }
}

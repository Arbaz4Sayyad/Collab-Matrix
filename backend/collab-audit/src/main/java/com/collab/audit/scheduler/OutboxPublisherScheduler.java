package com.collab.audit.scheduler;

import com.collab.audit.domain.OutboxEvent;
import com.collab.audit.repository.OutboxEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@EnableScheduling
@Slf4j
public class OutboxPublisherScheduler {

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private static final String KAFKA_TOPIC = "workspace.audit.events";

    @Scheduled(fixedDelay = 5000) // Poll database every 5 seconds
    public void publishOutboxEvents() {
        List<OutboxEvent> unprocessedEvents = outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc();
        if (unprocessedEvents.isEmpty()) {
            return;
        }

        log.info("Processing {} unprocessed transactional outbox events...", unprocessedEvents.size());

        for (OutboxEvent event : unprocessedEvents) {
            try {
                if (kafkaTemplate != null) {
                    // Send to Kafka topic, using aggregateId as the partition key to guarantee ordering per object!
                    kafkaTemplate.send(KAFKA_TOPIC, event.getAggregateId(), event.getPayload())
                            .whenComplete((result, ex) -> {
                                if (ex == null) {
                                    event.setProcessed(true);
                                    outboxEventRepository.save(event);
                                    log.info("Successfully published outbox event: {} to Kafka", event.getId());
                                } else {
                                    log.error("Failed to publish outbox event to Kafka: {}", ex.getMessage());
                                }
                            });
                } else {
                    // Fail gracefully / warn if running without local Kafka
                    log.warn("KafkaTemplate not loaded. Simulating local outbox processing. Marking event as processed.");
                    event.setProcessed(true);
                    outboxEventRepository.save(event);
                }
            } catch (Exception e) {
                log.error("Outbox publishing thread encountered exception for event: {}", event.getId(), e);
            }
        }
    }
}

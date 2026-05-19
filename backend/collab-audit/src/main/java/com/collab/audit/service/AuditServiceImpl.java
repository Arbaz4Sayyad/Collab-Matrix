package com.collab.audit.service;

import com.collab.audit.domain.AuditLog;
import com.collab.audit.domain.OutboxEvent;
import com.collab.audit.repository.AuditLogRepository;
import com.collab.audit.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class AuditServiceImpl implements AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void logActivity(UUID workspaceId, UUID operatorId, String action, String details) {
        log.info("Recording activity log in transaction: action={}, operator={}", action, operatorId);

        // 1. Persist local Postgres audit log record
        AuditLog auditLog = AuditLog.builder()
                .workspaceId(workspaceId)
                .operatorId(operatorId)
                .action(action)
                .details(details)
                .build();

        auditLog = auditLogRepository.save(auditLog);

        // 2. Persist local Postgres transactional Outbox event
        try {
            String payloadJson = objectMapper.writeValueAsString(auditLog);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType("AUDIT_LOG")
                    .aggregateId(auditLog.getId().toString())
                    .eventType(action)
                    .payload(payloadJson)
                    .build();

            outboxEventRepository.save(outboxEvent);
            log.info("Recorded Outbox event for transactional activity replication: {}", outboxEvent.getId());
        } catch (Exception e) {
            log.error("Failed to map audit log into transactional outbox", e);
            throw new RuntimeException("Audit outbox registration failed", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditHistory(UUID workspaceId) {
        return auditLogRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
    }
}

package com.collab.audit.service;

import com.collab.audit.domain.AuditLog;

import java.util.List;
import java.util.UUID;

public interface AuditService {
    void logActivity(UUID workspaceId, UUID operatorId, String action, String details);
    List<AuditLog> getAuditHistory(UUID workspaceId);
}

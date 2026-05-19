package com.collab.audit.controller;

import com.collab.audit.domain.AuditLog;
import com.collab.common.dto.ApiResponse;
import com.collab.audit.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workspaces/{workspaceId}/audit")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLog>>> getWorkspaceAuditTimeline(
            @PathVariable("workspaceId") UUID workspaceId) {
        
        List<AuditLog> response = auditService.getAuditHistory(workspaceId);
        return ResponseEntity.ok(ApiResponse.success(response, "Workspace audit logs retrieved successfully"));
    }
}

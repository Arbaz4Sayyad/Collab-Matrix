package com.collab.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String eventType; // e.g. CREATED, UPDATED, STATUS_CHANGED
    private UUID taskId;
    private UUID projectId;
    private String title;
    private String status;
    private UUID assigneeId;
    private UUID reporterId;
}

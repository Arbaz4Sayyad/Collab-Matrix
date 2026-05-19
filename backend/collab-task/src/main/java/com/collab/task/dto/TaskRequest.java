package com.collab.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class TaskRequest {

    @NotBlank(message = "Task title cannot be blank")
    @Size(min = 3, max = 100, message = "Task title must be between 3 and 100 characters")
    private String title;

    private String description;

    @NotBlank(message = "Task status cannot be blank")
    @Pattern(regexp = "^(BACKLOG|TODO|IN_PROGRESS|DONE)$", message = "Status must be BACKLOG, TODO, IN_PROGRESS, or DONE")
    private String status;

    @NotBlank(message = "Task priority cannot be blank")
    @Pattern(regexp = "^(LOW|MEDIUM|HIGH|URGENT)$", message = "Priority must be LOW, MEDIUM, HIGH, or URGENT")
    private String priority;

    private UUID assigneeId;
}

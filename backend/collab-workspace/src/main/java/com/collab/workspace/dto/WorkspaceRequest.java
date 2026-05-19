package com.collab.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WorkspaceRequest {

    @NotBlank(message = "Workspace name cannot be blank")
    @Size(min = 3, max = 50, message = "Workspace name must be between 3 and 50 characters")
    private String name;

    @NotBlank(message = "Workspace slug cannot be blank")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    @Size(min = 3, max = 30, message = "Slug must be between 3 and 30 characters")
    private String slug;
}

package com.collab.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {

    @NotBlank(message = "Project name cannot be blank")
    @Size(min = 3, max = 50, message = "Project name must be between 3 and 50 characters")
    private String name;

    @NotBlank(message = "Project key cannot be blank")
    @Pattern(regexp = "^[A-Z0-9]+$", message = "Key must be uppercase alphanumeric characters")
    @Size(min = 2, max = 10, message = "Key must be between 2 and 10 characters")
    private String key;

    private String description;
}

package com.collab.auth.domain;

public enum Permission {
    WORKSPACE_CREATE("workspace:create"),
    WORKSPACE_DELETE("workspace:delete"),
    WORKSPACE_WRITE("workspace:write"),
    PROJECT_CREATE("project:create"),
    PROJECT_WRITE("project:write"),
    TASK_CREATE("task:create"),
    TASK_WRITE("task:write"),
    CHAT_WRITE("chat:write"),
    DOC_WRITE("doc:write");

    private final String value;

    Permission(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

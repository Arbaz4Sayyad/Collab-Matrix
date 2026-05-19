package com.collab.infra.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ProjectSearchProvider {
    List<Map<String, Object>> searchProjects(UUID workspaceId, String keyword);
    List<UUID> getProjectIdsByWorkspace(UUID workspaceId);
}

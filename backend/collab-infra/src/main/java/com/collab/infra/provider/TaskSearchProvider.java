package com.collab.infra.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface TaskSearchProvider {
    List<Map<String, Object>> searchTasks(UUID projectId, String keyword);
}

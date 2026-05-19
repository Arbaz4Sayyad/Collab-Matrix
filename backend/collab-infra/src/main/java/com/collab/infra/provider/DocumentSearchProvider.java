package com.collab.infra.provider;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface DocumentSearchProvider {
    List<Map<String, Object>> searchDocuments(UUID projectId, String keyword);
}

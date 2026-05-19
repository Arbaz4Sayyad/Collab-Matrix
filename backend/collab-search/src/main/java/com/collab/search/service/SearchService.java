package com.collab.search.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SearchService {
    List<Map<String, Object>> searchWorkspace(UUID workspaceId, String query);
}

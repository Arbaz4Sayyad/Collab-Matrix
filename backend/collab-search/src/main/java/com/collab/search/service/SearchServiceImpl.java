package com.collab.search.service;

import com.collab.infra.provider.DocumentSearchProvider;
import com.collab.infra.provider.ProjectSearchProvider;
import com.collab.infra.provider.TaskSearchProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class SearchServiceImpl implements SearchService {

    @Autowired(required = false)
    private List<ProjectSearchProvider> projectSearchProviders = new ArrayList<>();

    @Autowired(required = false)
    private List<TaskSearchProvider> taskSearchProviders = new ArrayList<>();

    @Autowired(required = false)
    private List<DocumentSearchProvider> documentSearchProviders = new ArrayList<>();

    @Override
    @Cacheable(value = "global-search", key = "#workspaceId + '-' + #query")
    public List<Map<String, Object>> searchWorkspace(UUID workspaceId, String query) {
        log.info("Executing global workspace search: workspaceId={}, query='{}' (Cache Miss)", workspaceId, query);

        List<Map<String, Object>> results = new ArrayList<>();

        if (query == null || query.trim().isEmpty()) {
            return results;
        }

        String keyword = query.trim();

        // 1. Resolve Project IDs inside this workspace & search projects
        List<UUID> projectIds = new ArrayList<>();
        for (ProjectSearchProvider provider : projectSearchProviders) {
            try {
                // Find matching projects
                results.addAll(provider.searchProjects(workspaceId, keyword));
                // Collect active project IDs to query nested tasks & docs
                projectIds.addAll(provider.getProjectIdsByWorkspace(workspaceId));
            } catch (Exception e) {
                log.error("Failed to query ProjectSearchProvider", e);
            }
        }

        // 2. Query Tasks across workspace projects
        for (UUID projectId : projectIds) {
            for (TaskSearchProvider provider : taskSearchProviders) {
                try {
                    results.addAll(provider.searchTasks(projectId, keyword));
                } catch (Exception e) {
                    log.error("Failed to query TaskSearchProvider for project: {}", projectId, e);
                }
            }
        }

        // 3. Query Documents across workspace projects
        for (UUID projectId : projectIds) {
            for (DocumentSearchProvider provider : documentSearchProviders) {
                try {
                    results.addAll(provider.searchDocuments(projectId, keyword));
                } catch (Exception e) {
                    log.error("Failed to query DocumentSearchProvider for project: {}", projectId, e);
                }
            }
        }

        log.info("Search executed successfully. Found {} matches.", results.size());
        return results;
    }
}

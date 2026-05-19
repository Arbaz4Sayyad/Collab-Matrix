package com.collab.search.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.search.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/workspaces/{workspaceId}/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchWorkspace(
            @PathVariable("workspaceId") UUID workspaceId,
            @RequestParam("q") String query) {
        
        List<Map<String, Object>> response = searchService.searchWorkspace(workspaceId, query);
        return ResponseEntity.ok(ApiResponse.success(response, "Search executed successfully"));
    }
}

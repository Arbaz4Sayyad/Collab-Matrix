package com.collab.docs.controller;

import com.collab.common.dto.ApiResponse;
import com.collab.docs.dto.DocumentRequest;
import com.collab.docs.dto.DocumentResponse;
import com.collab.docs.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping("/projects/{projectId}/documents")
    public ResponseEntity<ApiResponse<DocumentResponse>> createDocument(
            @PathVariable("projectId") UUID projectId,
            @Valid @RequestBody DocumentRequest request) {
        
        DocumentResponse response = documentService.createDocument(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Document created successfully"));
    }

    @GetMapping("/projects/{projectId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getProjectDocuments(
            @PathVariable("projectId") UUID projectId) {
        
        List<DocumentResponse> response = documentService.getDocumentsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Documents retrieved successfully"));
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentDetails(
            @PathVariable("documentId") String documentId) {
        
        DocumentResponse response = documentService.getDocumentById(documentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Document details retrieved successfully"));
    }

    @PatchMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable("documentId") String documentId,
            @RequestBody DocumentRequest request) {
        
        DocumentResponse response = documentService.updateDocument(documentId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Document updated successfully"));
    }
}

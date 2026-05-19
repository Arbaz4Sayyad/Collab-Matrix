package com.collab.docs.service;

import com.collab.infra.provider.DocumentStateProvider;
import com.collab.infra.provider.DocumentSearchProvider;
import com.collab.docs.dto.DocumentRequest;
import com.collab.docs.dto.DocumentResponse;

import java.util.List;
import java.util.UUID;

public interface DocumentService extends DocumentStateProvider, DocumentSearchProvider {
    DocumentResponse createDocument(UUID projectId, DocumentRequest request);
    List<DocumentResponse> getDocumentsByProject(UUID projectId);
    DocumentResponse getDocumentById(String documentId);
    DocumentResponse updateDocument(String documentId, DocumentRequest request);
}

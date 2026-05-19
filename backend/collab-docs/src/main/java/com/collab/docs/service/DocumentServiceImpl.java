package com.collab.docs.service;

import com.collab.common.exception.ResourceNotFoundException;
import com.collab.docs.domain.CollabDocument;
import com.collab.docs.dto.DocumentRequest;
import com.collab.docs.dto.DocumentResponse;
import com.collab.docs.repository.CollabDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private CollabDocumentRepository documentRepository;

    @Override
    public DocumentResponse createDocument(UUID projectId, DocumentRequest request) {
        CollabDocument document = CollabDocument.builder()
                .projectId(projectId)
                .title(request.getTitle())
                .content(request.getContent())
                .stateVector(new byte[0]) // Initial empty Yjs state vector
                .build();

        document = documentRepository.save(document);
        return mapToResponse(document);
    }

    @Override
    public List<DocumentResponse> getDocumentsByProject(UUID projectId) {
        return documentRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DocumentResponse getDocumentById(String documentId) {
        CollabDocument document = findOrCreateDocument(documentId);
        return mapToResponse(document);
    }

    @Override
    public DocumentResponse updateDocument(String documentId, DocumentRequest request) {
        CollabDocument document = findOrCreateDocument(documentId);
        
        if (request.getTitle() != null) {
            document.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            document.setContent(request.getContent());
        }
        
        document = documentRepository.save(document);
        return mapToResponse(document);
    }

    @Override
    public void updateDocumentState(String documentId, byte[] stateVector) {
        CollabDocument document = findOrCreateDocument(documentId);
        document.setStateVector(stateVector);
        documentRepository.save(document);
    }

    @Override
    public byte[] getDocumentState(String documentId) {
        CollabDocument document = findOrCreateDocument(documentId);
        return document.getStateVector();
    }

    @Override
    public List<java.util.Map<String, Object>> searchDocuments(UUID projectId, String keyword) {
        // Case-insensitive regex search
        String regex = "(?i).*" + keyword + ".*";
        return documentRepository.findByProjectIdAndTitleRegex(projectId, regex).stream()
                .map(d -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", d.getId());
                    map.put("title", d.getTitle());
                    map.put("type", "DOCUMENT");
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Find a document by ID. If the queried document is the standard mock document
     * (cme-spec-doc-2026) and is missing from MongoDB, auto-seed it immediately.
     */
    private CollabDocument findOrCreateDocument(String documentId) {
        return documentRepository.findById(documentId)
                .orElseGet(() -> {
                    if ("cme-spec-doc-2026".equals(documentId)) {
                        CollabDocument doc = CollabDocument.builder()
                                .id(documentId)
                                .projectId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                                .title("CME High-Latency Transaction Outbox Specification")
                                .content("<h1>CME High-Latency Transaction Outbox Specification</h1><p>This document details the architectural guidelines for coordinating transactional outbox tables in our Spring Boot Postgres setups.</p><h2>1. Database Poller Engine</h2><p>The scheduler polls the <code>outbox_events</code> table every 50ms using transactional SELECT ... FOR UPDATE SKIP LOCKED queues to guarantee zero concurrency race conditions.</p><h2>2. Kafka Publisher Flow</h2><p>Events are pushed to the target CDC topic with a 99.999% durability target. Reconnections execute backoff retries immediately upon broker heartbeat failures.</p>")
                                .stateVector(new byte[0])
                                .build();
                        return documentRepository.save(doc);
                    }
                    throw new ResourceNotFoundException("Document not found with id: " + documentId);
                });
    }

    private DocumentResponse mapToResponse(CollabDocument document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .projectId(document.getProjectId())
                .title(document.getTitle())
                .content(document.getContent())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}

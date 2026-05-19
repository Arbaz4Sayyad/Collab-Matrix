package com.collab.docs.repository;

import com.collab.docs.domain.CollabDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollabDocumentRepository extends MongoRepository<CollabDocument, String> {
    List<CollabDocument> findByProjectId(UUID projectId);
    List<CollabDocument> findByProjectIdAndTitleRegex(UUID projectId, String titleRegex);
}

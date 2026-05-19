package com.collab.infra.provider;

public interface DocumentStateProvider {
    byte[] getDocumentState(String documentId);
    void updateDocumentState(String documentId, byte[] stateVector);
}

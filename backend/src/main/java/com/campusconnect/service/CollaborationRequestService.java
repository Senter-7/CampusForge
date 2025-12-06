package com.campusconnect.service;

import com.campusconnect.dto.CollaborationRequestDto;
import java.util.List;

public interface CollaborationRequestService {

    // Student sends request to join a project
    CollaborationRequestDto sendRequest(Long projectId, Long studentId);

    // Owner responds (approve/reject) to a collaboration request
    CollaborationRequestDto respondToRequest(Long requestId, Long ownerId, String action);

    // Owner views all requests for their project
    List<CollaborationRequestDto> getRequestsByProject(Long projectId, Long ownerId);

    // Student views all collaboration requests they've sent
    List<CollaborationRequestDto> getRequestsByStudent(Long studentId);
    
    // Owner views all pending collaboration requests they've received
    List<CollaborationRequestDto> getPendingRequestsByOwner(Long ownerId);
}

package com.campusconnect.mapper;

import com.campusconnect.dto.CollaborationRequestDto;
import com.campusconnect.entity.CollaborationRequest;

public class CollaborationRequestMapper {

    public static CollaborationRequestDto toDto(CollaborationRequest request) {
        if (request == null) return null;

        CollaborationRequestDto dto = new CollaborationRequestDto();
        dto.setRequestId(request.getRequestId());

        if (request.getProject() != null) {
            dto.setProjectId(request.getProject().getProjectId());
            dto.setProjectTitle(request.getProject().getTitle());
        }

        if (request.getStudent() != null) {
            dto.setStudentId(request.getStudent().getUserId()); // Student who sends the request
            dto.setStudentName(request.getStudent().getName());
        }

        if (request.getOwner() != null) {
            dto.setOwnerId(request.getOwner().getUserId()); // Project owner who receives the request
            dto.setOwnerName(request.getOwner().getName());
        }

        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        return dto;
    }
}

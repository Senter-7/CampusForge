package com.campusconnect.service;

import com.campusconnect.dto.CollaborationRequestDto;
import com.campusconnect.entity.*;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.mapper.CollaborationRequestMapper;
import com.campusconnect.repository.CollaborationRequestRepository;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CollaborationRequestServiceImpl implements CollaborationRequestService {

    @Autowired
    private CollaborationRequestRepository collaborationRequestRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public CollaborationRequestDto sendRequest(Long projectId, Long studentId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        // Prevent duplicate requests or existing members
        if (collaborationRequestRepository.existsByProjectAndStudent(project, student)) {
            throw new RuntimeException("A collaboration request already exists.");
        }
        if (projectMemberRepository.existsByProjectAndUser(project, student)) {
            throw new RuntimeException("This student is already a member of the project.");
        }

        CollaborationRequest request = new CollaborationRequest();
        request.setProject(project);
        request.setStudent(student);
        request.setStatus(CollaborationRequest.Status.PENDING);

        CollaborationRequest saved = collaborationRequestRepository.save(request);
        return CollaborationRequestMapper.toDto(saved);
    }

    @Override
    public CollaborationRequestDto respondToRequest(Long requestId, Long ownerId, String action) {
        CollaborationRequest request = collaborationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with ID: " + requestId));

        Project project = request.getProject();

        // Verify project creator (only project owner can respond)
        if (!project.getCreator().getUserId().equals(ownerId)) {
            throw new RuntimeException("Only the project owner can respond to collaboration requests.");
        }

        // Process approval/rejection
        if (action.equalsIgnoreCase("approve")) {
            request.setStatus(CollaborationRequest.Status.APPROVED);

            // Add to project members if not already added
            if (!projectMemberRepository.existsByProjectAndUser(project, request.getStudent())) {
                ProjectMember member = new ProjectMember();
                member.setProject(project);
                member.setUser(request.getStudent());
                member.setRole(ProjectMember.Role.MEMBER); // Default role
                projectMemberRepository.save(member);
            }

        } else if (action.equalsIgnoreCase("reject")) {
            request.setStatus(CollaborationRequest.Status.REJECTED);
        } else {
            throw new IllegalArgumentException("Invalid action. Use 'approve' or 'reject'.");
        }

        CollaborationRequest updated = collaborationRequestRepository.save(request);
        return CollaborationRequestMapper.toDto(updated);
    }

    @Override
    public List<CollaborationRequestDto> getRequestsByProject(Long projectId, Long ownerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        // Verify ownership
        if (!project.getCreator().getUserId().equals(ownerId)) {
            throw new RuntimeException("Access denied: You are not the project owner.");
        }

        return collaborationRequestRepository.findByProject(project)
                .stream()
                .map(CollaborationRequestMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CollaborationRequestDto> getRequestsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        return collaborationRequestRepository.findByStudent(student)
                .stream()
                .map(CollaborationRequestMapper::toDto)
                .collect(Collectors.toList());
    }
}

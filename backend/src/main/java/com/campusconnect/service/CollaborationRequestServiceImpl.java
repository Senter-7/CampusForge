package com.campusconnect.service;

import com.campusconnect.dto.CollaborationRequestDto;
import com.campusconnect.dto.NotificationDto;
import com.campusconnect.entity.*;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.mapper.CollaborationRequestMapper;
import com.campusconnect.repository.CollaborationRequestRepository;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.NotificationService;
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

    @Autowired
    private NotificationService notificationService;

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

        User projectOwner = project.getCreator();
        if (projectOwner == null) {
            throw new RuntimeException("Project owner not found.");
        }
        
        CollaborationRequest request = new CollaborationRequest();
        request.setProject(project);
        request.setStudent(student); // Student who sends the request (wants to join)
        request.setOwner(projectOwner); // Project owner who receives the request
        request.setStatus(CollaborationRequest.Status.PENDING);

        CollaborationRequest saved = collaborationRequestRepository.save(request);
        
        // Notify project owner about the collaboration request
        try {
            if (projectOwner != null && !projectOwner.getUserId().equals(studentId)) {
                NotificationDto notification = new NotificationDto();
                notification.setUserId(projectOwner.getUserId());
                notification.setMessage(String.format("%s wants to join your project \"%s\"", 
                    student.getName() != null ? student.getName() : "A student", 
                    project.getTitle() != null ? project.getTitle() : "Untitled Project"));
                notification.setRead(false);
                notificationService.createNotification(notification);
            }
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Failed to create notification for collaboration request: " + e.getMessage());
        }
        
        return CollaborationRequestMapper.toDto(saved);
    }

    @Override
    public CollaborationRequestDto respondToRequest(Long requestId, Long ownerId, String action) {
        CollaborationRequest request = collaborationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with ID: " + requestId));

        Project project = request.getProject();

        // Verify project owner (only project owner can respond)
        User requestOwner = request.getOwner();
        if (requestOwner == null || !requestOwner.getUserId().equals(ownerId)) {
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

            // Notify student that their request was approved
            try {
                User student = request.getStudent();
                if (student != null) {
                    NotificationDto notification = new NotificationDto();
                    notification.setUserId(student.getUserId());
                    notification.setMessage(String.format("Your request to join \"%s\" has been approved!", 
                        project.getTitle() != null ? project.getTitle() : "Untitled Project"));
                    notification.setRead(false);
                    notificationService.createNotification(notification);
                }
            } catch (Exception e) {
                System.err.println("Failed to create approval notification: " + e.getMessage());
            }

        } else if (action.equalsIgnoreCase("reject")) {
            request.setStatus(CollaborationRequest.Status.REJECTED);
            
            // Notify student that their request was rejected
            try {
                User student = request.getStudent();
                if (student != null) {
                    NotificationDto notification = new NotificationDto();
                    notification.setUserId(student.getUserId());
                    notification.setMessage(String.format("Your request to join \"%s\" has been declined.", 
                        project.getTitle() != null ? project.getTitle() : "Untitled Project"));
                    notification.setRead(false);
                    notificationService.createNotification(notification);
                }
            } catch (Exception e) {
                System.err.println("Failed to create rejection notification: " + e.getMessage());
            }
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

        // Verify ownership - check both project creator and request owner
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

    @Override
    public List<CollaborationRequestDto> getPendingRequestsByOwner(Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with ID: " + ownerId));

        return collaborationRequestRepository.findByOwner(owner)
                .stream()
                .filter(request -> request.getStatus() == CollaborationRequest.Status.PENDING)
                .map(CollaborationRequestMapper::toDto)
                .collect(Collectors.toList());
    }
}

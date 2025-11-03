package com.campusconnect.service;

import com.campusconnect.dto.*;
import com.campusconnect.mapper.DashboardMapper;
import com.campusconnect.mapper.ProjectMapper;
import com.campusconnect.mapper.TaskMapper;
import com.campusconnect.mapper.MessageMapper;
import com.campusconnect.repository.*;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CollaborationRequestRepository collaborationRequestRepository;
    private final MessageRepository messageRepository;

    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final DashboardMapper dashboardMapper;
    private final MessageMapper messageMapper;

    public DashboardServiceImpl(ProjectRepository projectRepository,
                                TaskRepository taskRepository,
                                CollaborationRequestRepository collaborationRequestRepository,
                                MessageRepository messageRepository,
                                ProjectMapper projectMapper,
                                TaskMapper taskMapper,
                                DashboardMapper dashboardMapper,
                                MessageMapper messageMapper) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.collaborationRequestRepository = collaborationRequestRepository;
        this.messageRepository = messageRepository;
        this.projectMapper = projectMapper;
        this.taskMapper = taskMapper;
        this.dashboardMapper = dashboardMapper;
        this.messageMapper = messageMapper;
    }

    @Override
    public DashboardDto getDashboardForUser(Long userId) {
        DashboardDto dto = new DashboardDto();

        dto.setProjects(
                projectRepository.findAllByUserId(userId)
                        .stream()
                        .map(projectMapper::toDto)
                        .collect(Collectors.toList())
        );

        dto.setAssignedTasks(
                taskRepository.findByAssignedTo_UserId(userId)
                        .stream()
                        .map(taskMapper::toDto)
                        .collect(Collectors.toList())
                );


        dto.setPendingRequests(
                collaborationRequestRepository.findPendingRequestsByUserId(userId)
                        .stream()
                        .map(dashboardMapper::toCollaborationRequestDto)
                        .collect(Collectors.toList())
        );

        dto.setRecentMessages(
                messageRepository.findRecentMessagesByUser(userId)
                        .stream()
                        .map(messageMapper::toMessageSummaryDto)
                        .collect(Collectors.toList())
        );

        return dto;
    }
}

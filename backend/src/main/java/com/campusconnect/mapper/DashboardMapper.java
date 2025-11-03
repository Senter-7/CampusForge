package com.campusconnect.mapper;

import com.campusconnect.dto.*;
import com.campusconnect.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DashboardMapper {

    // ---------- Project ----------
    public ProjectDto toProjectDto(Project project) {
        if (project == null) return null;

        ProjectDto dto = new ProjectDto();
        dto.setProjectId(project.getProjectId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : null);
        dto.setCreatorId(project.getCreator() != null ? project.getCreator().getUserId() : null);

        return dto;
    }

    // ---------- Task ----------
    public TaskDto toTaskDto(Task task) {
        if (task == null) return null;

        TaskDto dto = new TaskDto();
        dto.setTaskId(task.getTaskId());
        dto.setProjectId(task.getProject() != null ? task.getProject().getProjectId() : null);
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setAssignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getUserId() : null);
        dto.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
        dto.setDueDate(task.getDueDate());
        dto.setCreatedAt(task.getCreatedAt());

        return dto;
    }

    // ---------- Collaboration Request ----------
    public CollaborationRequestDto toCollaborationRequestDto(CollaborationRequest request) {
        if (request == null) return null;

        CollaborationRequestDto dto = new CollaborationRequestDto();
        dto.setRequestId(request.getRequestId());
        dto.setProjectId(request.getProject() != null ? request.getProject().getProjectId() : null);
        dto.setProjectTitle(request.getProject() != null ? request.getProject().getTitle() : null);
        dto.setStudentId(request.getStudent() != null ? request.getStudent().getUserId() : null);
        dto.setStudentName(request.getStudent() != null ? request.getStudent().getName() : null);
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());

        return dto;
    }

    // ---------- Message Summary ----------
    public MessageSummaryDto toMessageSummaryDto(Message message) {
        if (message == null) return null;

        MessageSummaryDto dto = new MessageSummaryDto();
        dto.setMessageId(message.getMessageId());
        dto.setProjectId(message.getProject() != null ? message.getProject().getProjectId() : null);
        dto.setProjectTitle(message.getProject() != null ? message.getProject().getTitle() : null);
        dto.setLastMessage(message.getContent());
        dto.setSenderName(message.getSender() != null ? message.getSender().getName() : null);
        dto.setCreatedAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null);

        return dto;
    }

    // ---------- List Converters ----------
    public List<ProjectDto> toProjectDtoList(List<Project> projects) {
        return projects == null ? null : projects.stream().map(this::toProjectDto).collect(Collectors.toList());
    }

    public List<TaskDto> toTaskDtoList(List<Task> tasks) {
        return tasks == null ? null : tasks.stream().map(this::toTaskDto).collect(Collectors.toList());
    }

    public List<CollaborationRequestDto> toCollaborationRequestDtoList(List<CollaborationRequest> requests) {
        return requests == null ? null : requests.stream().map(this::toCollaborationRequestDto).collect(Collectors.toList());
    }

    public List<MessageSummaryDto> toMessageSummaryDtoList(List<Message> messages) {
        return messages == null ? null : messages.stream().map(this::toMessageSummaryDto).collect(Collectors.toList());
    }
}

package com.campusconnect.mapper;

import com.campusconnect.dto.TaskDto;
import com.campusconnect.entity.Task;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskDto toDto(Task task) {
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

    public Task toEntity(TaskDto dto) {
        if (dto == null) return null;

        Task task = new Task();
        task.setTaskId(dto.getTaskId());
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());

        if (dto.getStatus() != null)
            task.setStatus(Task.Status.valueOf(dto.getStatus()));

        task.setDueDate(dto.getDueDate());
        task.setCreatedAt(dto.getCreatedAt());

        if (dto.getProjectId() != null) {
            Project project = new Project();
            project.setProjectId(dto.getProjectId());
            task.setProject(project);
        }

        if (dto.getAssignedToId() != null) {
            User user = new User();
            user.setUserId(dto.getAssignedToId());
            task.setAssignedTo(user);
        }

        return task;
    }
}

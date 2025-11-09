package com.campusconnect.service;

import com.campusconnect.dto.TaskRequestDTO;
import com.campusconnect.dto.TaskResponseDTO;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.ProjectMember;
import com.campusconnect.entity.Task;
import com.campusconnect.entity.User;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.TaskRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    

    // ✅ Get all tasks in a project
    @Override
    public List<TaskResponseDTO> getTasksByProject(Long projectId) {
        return taskRepository.findByProject_ProjectId(projectId)
                .stream().map(this::mapToDto).toList();
    }

    // ✅ Get all tasks assigned to a specific user
    public List<TaskResponseDTO> getTasksByAssignee(Long userId) {
        return taskRepository.findByAssignedTo_UserId(userId)
                .stream().map(this::mapToDto).toList();
    }

    // ✅ Update task status
    @Override
    public TaskResponseDTO updateTaskStatus(Long taskId, String status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        Task.Status newStatus = Task.Status.valueOf(status.toUpperCase());
        task.setStatus(newStatus);
        
        // Set completedAt when status changes to DONE
        if (newStatus == Task.Status.DONE && task.getCompletedAt() == null) {
            task.setCompletedAt(java.time.LocalDateTime.now());
        }
        
        return mapToDto(taskRepository.save(task));
    }


    
    @Override
    public TaskResponseDTO createTask(TaskRequestDTO dto, Long createdById) {
        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));

        User creator = userRepository.findById(createdById)
                .orElseThrow(() -> new EntityNotFoundException("Creator not found"));

        // ✅ Check membership
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, creator)
                .orElseThrow(() -> new RuntimeException("You are not a member of this project."));

        // ✅ Allow all members to create tasks
        User assignee = dto.getAssignedToId() != null
                ? userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new EntityNotFoundException("Assignee not found"))
                : null;

        // Default status to TODO if not provided
        Task.Status status = dto.getStatus() != null && !dto.getStatus().trim().isEmpty()
                ? Task.Status.valueOf(dto.getStatus().toUpperCase())
                : Task.Status.TODO;
        
        // Default priority to MEDIUM if not provided
        Task.Priority priority = dto.getPriority() != null && !dto.getPriority().trim().isEmpty()
                ? Task.Priority.valueOf(dto.getPriority().toUpperCase())
                : Task.Priority.MEDIUM;

        Task task = Task.builder()
                .project(project)
                .createdBy(creator)
                .assignedTo(assignee)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(status)
                .priority(priority)
                .dueDate(dto.getDueDate())
                .build();

        return mapToDto(taskRepository.save(task));
    }

    @Override
    public TaskResponseDTO assignTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Verify assignee is a project member
        Project project = task.getProject();
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, assignee)
                .orElseThrow(() -> new RuntimeException("Assignee is not a member of this project."));

        // Authorization (only leader/mentor can assign) is handled by @PreAuthorize in the controller
        task.setAssignedTo(assignee);
        return mapToDto(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        // Authorization is handled by @PreAuthorize in the controller
        // which checks if user is leader, mentor, creator, or assignee
        taskRepository.delete(task);
    }


    // 🔁 DTO Mapper
    private TaskResponseDTO mapToDto(Task task) {
        return TaskResponseDTO.builder()
                .taskId(task.getTaskId())
                .projectId(task.getProject().getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getUserId() : null)
                .createdById(task.getCreatedBy().getUserId())
                .build();
    }
}

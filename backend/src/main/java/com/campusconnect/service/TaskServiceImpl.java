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

        task.setStatus(Task.Status.valueOf(status.toUpperCase()));
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

        Task task = Task.builder()
                .project(project)
                .createdBy(creator)
                .assignedTo(assignee)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(Task.Status.valueOf(dto.getStatus().toUpperCase()))
                .priority(Task.Priority.valueOf(dto.getPriority().toUpperCase()))
                .dueDate(dto.getDueDate())
                .build();

        return mapToDto(taskRepository.save(task));
    }

    @Override
    public TaskResponseDTO assignTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        Project project = task.getProject();

        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // ✅ Only leader or mentor can assign tasks
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, assignee)
                .orElseThrow(() -> new RuntimeException("You are not a member of this project."));
        if (member.getRole() != ProjectMember.Role.LEADER && member.getRole() != ProjectMember.Role.MENTOR) {
            throw new RuntimeException("Only leader or mentor can assign tasks.");
        }

        task.setAssignedTo(assignee);
        return mapToDto(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        Project project = task.getProject();
        User currentUser = userRepository.findById(task.getCreatedBy().getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, currentUser)
                .orElseThrow(() -> new RuntimeException("You are not a member of this project."));

        // ✅ Only leaders, mentors, or creators can delete
        if (member.getRole() == ProjectMember.Role.MEMBER && !task.getCreatedBy().equals(currentUser)) {
            throw new RuntimeException("You are not authorized to delete this task.");
        }

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


package com.campusconnect.service;

import com.campusconnect.dto.TaskDto;
import com.campusconnect.entity.Task;
import com.campusconnect.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    public List<TaskDto> getTasksForProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public TaskDto createTask(TaskDto taskDto) {
        Task task = new Task();
        task.setProjectId(taskDto.getProjectId());
        task.setDescription(taskDto.getDescription());
        task.setCompleted(taskDto.isCompleted());
        taskRepository.save(task);
        return toDto(task);
    }

    public TaskDto updateTask(Long id, TaskDto taskDto) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setDescription(taskDto.getDescription());
        task.setCompleted(taskDto.isCompleted());
        taskRepository.save(task);
        return toDto(task);
    }

    private TaskDto toDto(Task task) {
        TaskDto dto = new TaskDto();
        dto.setId(task.getId());
        dto.setProjectId(task.getProjectId());
        dto.setDescription(task.getDescription());
        dto.setCompleted(task.isCompleted());
        return dto;
    }
}

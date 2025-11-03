package com.campusconnect.service;

import com.campusconnect.dto.TaskRequestDTO;
import com.campusconnect.dto.TaskResponseDTO;

import java.util.List;

public interface TaskService {

    TaskResponseDTO createTask(TaskRequestDTO dto, Long createdById);

    List<TaskResponseDTO> getTasksByProject(Long projectId);

    TaskResponseDTO updateTaskStatus(Long taskId, String status);

    TaskResponseDTO assignTask(Long taskId, Long userId);

    void deleteTask(Long taskId);
    
    List<TaskResponseDTO> getTasksByAssignee(Long userId);

}

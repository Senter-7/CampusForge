package com.campusconnect.service;

import com.campusconnect.dto.TaskCommentDTO;
import com.campusconnect.entity.Task;
import com.campusconnect.entity.TaskComment;
import com.campusconnect.entity.User;
import com.campusconnect.repository.TaskCommentRepository;
import com.campusconnect.repository.TaskRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskCommentServiceImpl implements TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    public TaskCommentDTO addComment(Long taskId, Long userId, String content) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskComment comment = TaskComment.builder()
                .task(task)
                .user(user)
                .content(content)
                .build();

        taskCommentRepository.save(comment);
        return mapToDTO(comment);
    }

    @Override
    public List<TaskCommentDTO> getCommentsByTask(Long taskId) {
        return taskCommentRepository.findByTask_TaskId(taskId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private TaskCommentDTO mapToDTO(TaskComment comment) {
        return TaskCommentDTO.builder()
                .commentId(comment.getCommentId())
                .taskId(comment.getTask().getTaskId())
                .username(comment.getUser().getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}

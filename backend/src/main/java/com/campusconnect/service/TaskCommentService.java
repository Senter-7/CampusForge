package com.campusconnect.service;

import com.campusconnect.dto.TaskCommentDTO;

import java.util.List;

public interface TaskCommentService {

    TaskCommentDTO addComment(Long taskId, Long userId, String content);

    List<TaskCommentDTO> getCommentsByTask(Long taskId);
}

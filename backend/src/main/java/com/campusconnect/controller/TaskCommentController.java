package com.campusconnect.controller;

import com.campusconnect.dto.TaskCommentDTO;
import com.campusconnect.service.TaskCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/task-comments")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService commentService;

    @PostMapping("/{taskId}/add")
    public ResponseEntity<TaskCommentDTO> addComment(@PathVariable Long taskId,
                                                     @RequestParam Long userId,
                                                     @RequestParam String content) {
        return ResponseEntity.ok(commentService.addComment(taskId, userId, content));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TaskCommentDTO>> getCommentsByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getCommentsByTask(taskId));
    }
}

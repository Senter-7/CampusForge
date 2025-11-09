package com.campusconnect.controller;

import com.campusconnect.dto.TaskRequestDTO;
import com.campusconnect.dto.TaskResponseDTO;
import com.campusconnect.security.UserPrincipal;
import com.campusconnect.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ✅ Create task — only members can create
    @PostMapping("/create")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #dto.projectId)")
    public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskRequestDTO dto,
                                                      @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(taskService.createTask(dto, currentUser.getId()));
    }

    // ✅ List tasks — members only
    @GetMapping("/project/{projectId}")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #projectId)")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    // ✅ Update status — only task owner, assignee, leader, or mentor
    @PatchMapping("/{taskId}/status")
    @PreAuthorize("@projectSecurity.canModifyTask(authentication, #taskId)")
    public ResponseEntity<TaskResponseDTO> updateTaskStatus(@PathVariable Long taskId,
                                                            @RequestParam String status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, status));
    }

    // ✅ Assign task — only leader or mentor
    @PatchMapping("/{taskId}/assign/{userId}")
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #taskRepository.findById(#taskId).get().project.id)")
    public ResponseEntity<TaskResponseDTO> assignTask(@PathVariable Long taskId,
                                                      @PathVariable Long userId) {
        return ResponseEntity.ok(taskService.assignTask(taskId, userId));
    }

    // ✅ Delete task — only leader, mentor, or creator
    @DeleteMapping("/{taskId}")
    @PreAuthorize("@projectSecurity.canModifyTask(authentication, #taskId)")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    // ✅ Get all tasks assigned to a user
    @GetMapping("/assigned/{userId}")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #userId)")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByAssignee(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.getTasksByAssignee(userId));
    }

    // ✅ Get tasks in a project filtered by status
    @GetMapping("/project/{projectId}/status")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #projectId)")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByStatus(@PathVariable Long projectId,
                                                                @RequestParam String status) {
        return ResponseEntity.ok(
            taskService.getTasksByProject(projectId).stream()
                .filter(t -> t.getStatus().equalsIgnoreCase(status))
                .toList()
        );
    }

}

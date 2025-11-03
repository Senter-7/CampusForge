package com.campusconnect.controller;

import com.campusconnect.dto.CollaborationRequestDto;
import com.campusconnect.service.CollaborationRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collaboration")
public class CollaborationRequestController {

    @Autowired
    private CollaborationRequestService collaborationRequestService;

    // ✅ Student sends a collaboration request
    @PostMapping("/send")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CollaborationRequestDto> sendRequest(
            @RequestParam Long projectId,
            @RequestParam Long studentId) {
        return ResponseEntity.ok(collaborationRequestService.sendRequest(projectId, studentId));
    }

    // ✅ Project owner responds (approve / reject)
    @PutMapping("/{requestId}/respond")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')") // Owner is a student, but admins can override
    public ResponseEntity<CollaborationRequestDto> respondToRequest(
            @PathVariable Long requestId,
            @RequestParam Long ownerId,
            @RequestParam String action) {
        return ResponseEntity.ok(collaborationRequestService.respondToRequest(requestId, ownerId, action));
    }

    // ✅ Get all requests by project (for project owner)
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<CollaborationRequestDto>> getRequestsByProject(
            @PathVariable Long projectId,
            @RequestParam Long ownerId) {
        return ResponseEntity.ok(collaborationRequestService.getRequestsByProject(projectId, ownerId));
    }

    // ✅ Get all requests sent by a student
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<CollaborationRequestDto>> getRequestsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(collaborationRequestService.getRequestsByStudent(studentId));
    }
}

package com.campusconnect.controller;

import com.campusconnect.dto.CollaborationRequestDto;
import com.campusconnect.dto.ProjectDto;
import com.campusconnect.dto.ProjectMemberDto;
import com.campusconnect.security.UserPrincipal;
import com.campusconnect.service.CollaborationRequestService;
import com.campusconnect.service.ProjectMemberService;
import com.campusconnect.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private CollaborationRequestService collaborationRequestService;

    @Autowired
    private ProjectMemberService projectMemberService;

    // ✅ Create new project (any STUDENT)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping
    public ResponseEntity<ProjectDto> createProject(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.createProject(projectDto, currentUser.getId()));
    }

    // ✅ Get all projects (public)
    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects(
            @RequestParam(required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(projectService.searchProjects(search.trim()));
        }
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    // ✅ Get project by ID (public)
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    // ✅ Update project (only owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #id)")
    @PutMapping("/{id}")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDto, currentUser.getId()));
    }

    // ✅ Delete project (only owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #id)")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        projectService.deleteProject(id, currentUser.getId());
        return ResponseEntity.ok("Project deleted successfully.");
    }

    // ✅ Join project (any STUDENT)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/join")
    public ResponseEntity<String> joinProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        projectService.joinProject(id, currentUser.getId());
        return ResponseEntity.ok("Joined project successfully.");
    }

    // ✅ Get all projects a student is part of (STUDENT only)
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/me")
    public ResponseEntity<List<ProjectDto>> getProjectsByCurrentStudent(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(projectService.getProjectsByStudent(currentUser.getId()));
    }

    // ✅ Send collaboration request (any STUDENT)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{projectId}/requests")
    public ResponseEntity<CollaborationRequestDto> sendRequest(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(collaborationRequestService.sendRequest(projectId, currentUser.getId()));
    }

    // ✅ Respond to collaboration request (only project owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #requestId)")
    @PutMapping("/requests/{requestId}/respond")
    public ResponseEntity<CollaborationRequestDto> respondToRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam String action) {
        return ResponseEntity.ok(collaborationRequestService.respondToRequest(requestId, currentUser.getId(), action));
    }

    // ✅ Get all collaboration requests for a project (only project owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #projectId)")
    @GetMapping("/{projectId}/requests")
    public ResponseEntity<List<CollaborationRequestDto>> getRequestsByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(collaborationRequestService.getRequestsByProject(projectId, currentUser.getId()));
    }

    // ✅ Get all collaboration requests by current student
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/requests/me")
    public ResponseEntity<List<CollaborationRequestDto>> getRequestsByCurrentStudent(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(collaborationRequestService.getRequestsByStudent(currentUser.getId()));
    }

    // ✅ Get members of a project (any authenticated user)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMemberDto>> getMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectMemberService.getMembersByProject(projectId));
    }

    // ✅ Add member (only owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #projectId)")
    @PostMapping("/{projectId}/members")
    public ResponseEntity<String> addMember(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam Long userId,
            @RequestParam(required = false) String role) {
        projectMemberService.addMember(projectId, userId, currentUser.getId(), role);
        return ResponseEntity.ok("Member added successfully.");
    }

    // ✅ Remove member (only owner or mentor)
    @PreAuthorize("@projectSecurity.isProjectOwner(authentication, #projectId)")
    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<String> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        projectMemberService.removeMember(projectId, userId, currentUser.getId());
        return ResponseEntity.ok("Member removed successfully.");
    }
}

package com.campusconnect.security;

import com.campusconnect.entity.ProjectMember;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.TaskRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component("projectSecurity")
@RequiredArgsConstructor
public class ProjectSecurity {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;

    /**
     * Check if the authenticated user is a member of a project.
     */
    public boolean isProjectMember(Authentication authentication, Long projectId) {
        String email = authentication.getName();
        return projectRepository.findById(projectId)
                .map(project -> projectMemberRepository.findByProject(project).stream()
                        .anyMatch(pm -> pm.getUser().getEmail().equals(email)))
                .orElse(false);
    }

    /**
     * Check if the authenticated user is a project owner (leader or mentor).
     */
    public boolean isProjectOwner(Authentication authentication, Long projectId) {
        String email = authentication.getName();
        return projectRepository.findById(projectId)
                .map(project -> projectMemberRepository.findByProject(project).stream()
                        .anyMatch(pm ->
                                pm.getUser().getEmail().equals(email) &&
                                (pm.getRole() == ProjectMember.Role.LEADER ||
                                 pm.getRole() == ProjectMember.Role.MENTOR)))
                .orElse(false); // ✅ this fixes the Optional<Boolean> issue
    }

    /**
     * Check if the user can modify a specific task.
     * Allowed for project leader, mentor, or the task creator/assignee.
     */
    public boolean canModifyTask(Authentication authentication, Long taskId) {
        if (authentication == null || authentication.getName() == null) {
            return false;
        }
        
        String email = authentication.getName();

        // Use eager fetch to avoid LazyInitializationException
        return taskRepository.findByIdWithRelations(taskId)
                .map(task -> {
                    try {
                        // Check if user is project member first (any project member should be able to view/modify tasks in their projects)
                        Long projectId = task.getProject().getProjectId();
                        
                        // Leader or mentor can always modify
                        if (isProjectOwner(authentication, projectId)) {
                            return true;
                        }
                        
                        // Check if user is a project member (all members should be able to modify tasks)
                        if (isProjectMember(authentication, projectId)) {
                            // For collaborative projects, allow any project member to modify tasks
                            // This enables team members to update task status, mark as complete, etc.
                            return true;
                        }
                        
                        return false;
                    } catch (Exception e) {
                        // Log error and deny access on exception
                        System.err.println("Error checking task modification permission: " + e.getMessage());
                        return false;
                    }
                })
                .orElse(false);
    }
}

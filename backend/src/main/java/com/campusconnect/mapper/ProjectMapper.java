package com.campusconnect.mapper;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.dto.SkillDto;
import com.campusconnect.entity.Project;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ProjectMapper {

    public ProjectDto toDto(Project project) {
        if (project == null) return null;

        ProjectDto dto = new ProjectDto();
        dto.setProjectId(project.getProjectId());
        dto.setTitle(project.getTitle() != null ? project.getTitle() : "");
        dto.setDescription(project.getDescription() != null ? project.getDescription() : "");
        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : "OPEN");
        dto.setCreatedAt(project.getCreatedAt());
        dto.setCreatorId(project.getCreator() != null ? project.getCreator().getUserId() : null);
        dto.setMembersRequired(project.getMembersRequired());
        dto.setDeadline(project.getDeadline());

        // Map skills - handle null and lazy loading exceptions
        try {
            if (project.getSkills() != null) {
                Set<SkillDto> skillDtos = project.getSkills().stream()
                    .filter(skill -> skill != null)
                    .map(skill -> new SkillDto(skill.getSkillId(), skill.getName() != null ? skill.getName() : ""))
                    .collect(Collectors.toSet());
                dto.setSkills(skillDtos);
            } else {
                dto.setSkills(new java.util.HashSet<>());
            }
        } catch (Exception e) {
            // If lazy loading fails, set empty set
            dto.setSkills(new java.util.HashSet<>());
        }

        // Map member IDs - We'll set this from ProjectMemberRepository in the service layer
        // For now, set empty set - the service will populate it
        dto.setMemberIds(new java.util.HashSet<>());

        return dto;
    }

    public Project toEntity(ProjectDto dto) {
        if (dto == null) return null;

        Project project = new Project();
        project.setProjectId(dto.getProjectId());
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                // Convert to uppercase to handle case-insensitive input
                project.setStatus(Project.Status.valueOf(dto.getStatus().toUpperCase().trim()));
            } catch (IllegalArgumentException e) {
                // If status is invalid, default to OPEN
                project.setStatus(Project.Status.OPEN);
            }
        } else {
            // Default to OPEN if status is not provided
            project.setStatus(Project.Status.OPEN);
        }
        
        // Map membersRequired and deadline
        project.setMembersRequired(dto.getMembersRequired());
        project.setDeadline(dto.getDeadline());
        
        // Skills will be set separately in the service

        return project;
    }
}

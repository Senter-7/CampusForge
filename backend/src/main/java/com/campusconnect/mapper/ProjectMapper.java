package com.campusconnect.mapper;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public ProjectDto toDto(Project project) {
        if (project == null) return null;

        ProjectDto dto = new ProjectDto();
        dto.setProjectId(project.getProjectId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setStatus(project.getStatus().name());
        //dto.setTags(project.getTags());  // only if your entity has `tags`
        dto.setCreatorId(project.getCreator() != null ? project.getCreator().getUserId() : null);

        return dto;
    }

    public Project toEntity(ProjectDto dto) {
        if (dto == null) return null;

        Project project = new Project();
        project.setProjectId(dto.getProjectId());
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setStatus(Project.Status.valueOf(dto.getStatus())); 
        // project.setTags(dto.getTags()); // only if your DTO has `tags`

        return project;
    }
}

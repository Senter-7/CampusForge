
package com.campusconnect.service;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.entity.Project;
import com.campusconnect.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ProjectDto> searchProjects(String skills, String interests) {
        return projectRepository.findBySkillsAndInterests(skills, interests).stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProjectDto createProject(ProjectDto projectDto) {
        Project project = new Project();
        project.setTitle(projectDto.getTitle());
        project.setDescription(projectDto.getDescription());
        project.setSkills(projectDto.getSkills());
        project.setInterests(projectDto.getInterests());
        project.setOwnerId(projectDto.getOwnerId());
        project.setMemberIds(projectDto.getMemberIds());
        projectRepository.save(project);
        return toDto(project);
    }

    public ProjectDto joinProject(Long id, Long userId) {
        Project project = projectRepository.findById(id).orElseThrow();
        project.getMemberIds().add(userId);
        projectRepository.save(project);
        return toDto(project);
    }

    private ProjectDto toDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setSkills(project.getSkills());
        dto.setInterests(project.getInterests());
        dto.setOwnerId(project.getOwnerId());
        dto.setMemberIds(project.getMemberIds());
        return dto;
    }
}

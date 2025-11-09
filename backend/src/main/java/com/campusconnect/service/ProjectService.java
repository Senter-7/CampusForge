package com.campusconnect.service;

import com.campusconnect.dto.ProjectDto;
import java.util.List;

public interface ProjectService {
    ProjectDto createProject(ProjectDto projectDto, Long creatorId);
    List<ProjectDto> getAllProjects();
    ProjectDto getProjectById(Long id);
    ProjectDto updateProject(Long id, ProjectDto projectDto, Long studentId);
    void deleteProject(Long id, Long studentId);
    void joinProject(Long projectId, Long studentId);
    List<ProjectDto> getProjectsByStudent(Long studentId);
    List<ProjectDto> searchProjects(String query);
}

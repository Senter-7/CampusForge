package com.campusconnect.service;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.ProjectMember;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.ProjectMemberRepository;

import com.campusconnect.repository.UserRepository;
import com.campusconnect.mapper.ProjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMapper projectMapper;

    @Override
    public ProjectDto createProject(ProjectDto projectDto, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + creatorId));

        Project project = projectMapper.toEntity(projectDto);
        project.setCreator(creator);

        Project saved = projectRepository.save(project);
        return projectMapper.toDto(saved);
    }

    @Override
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(projectMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        return projectMapper.toDto(project);
    }

    

    

    @Override
    public void joinProject(Long projectId, Long studentId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + studentId));

        project.getMembers().add(student);
        projectRepository.save(project);
    }

    @Override
    public List<ProjectDto> getProjectsByStudent(Long studentId) {
        return projectRepository.findAll().stream()
                .filter(p -> p.getMembers().stream().anyMatch(m -> m.getUserId().equals(studentId)))
                .map(projectMapper::toDto)
                .collect(Collectors.toList());
    }
    @Override
    public ProjectDto updateProject(Long id, ProjectDto projectDto, Long studentId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        // ✅ Role-based check: only leader or mentor
        ProjectMember member = projectMemberRepository.findByProjectAndUser(project,
                userRepository.findById(studentId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found")))
                .orElseThrow(() -> new RuntimeException("You are not a member of this project."));

        if (member.getRole() != ProjectMember.Role.LEADER && member.getRole() != ProjectMember.Role.MENTOR) {
            throw new RuntimeException("Only leaders or mentors can update the project.");
        }

        project.setTitle(projectDto.getTitle());
        project.setDescription(projectDto.getDescription());
        return projectMapper.toDto(projectRepository.save(project));
    }

    @Override
    public void deleteProject(Long id, Long studentId) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        ProjectMember member = projectMemberRepository.findByProjectAndUser(project,
                userRepository.findById(studentId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found")))
                .orElseThrow(() -> new RuntimeException("You are not a member of this project."));

        // ✅ Only leaders or mentors can delete
        if (member.getRole() != ProjectMember.Role.LEADER && member.getRole() != ProjectMember.Role.MENTOR) {
            throw new RuntimeException("Only leaders or mentors can delete this project.");
        }

        projectRepository.delete(project);
}

}

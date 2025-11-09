package com.campusconnect.service;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.dto.SkillDto;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.ProjectMember;
import com.campusconnect.entity.Skill;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.SkillRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.mapper.ProjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private ProjectMapper projectMapper;

    @Override
    public ProjectDto createProject(ProjectDto projectDto, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + creatorId));

        // Ensure status is set correctly (default to OPEN if not provided)
        if (projectDto.getStatus() == null || projectDto.getStatus().trim().isEmpty()) {
            projectDto.setStatus("OPEN");
        }
        
        Project project = projectMapper.toEntity(projectDto);
        project.setCreator(creator);
        
        // Ensure status is set (mapper should handle it, but double-check)
        if (project.getStatus() == null) {
            project.setStatus(Project.Status.OPEN);
        }
        
        // Set membersRequired and deadline
        if (projectDto.getMembersRequired() != null) {
            project.setMembersRequired(projectDto.getMembersRequired());
        } else {
            project.setMembersRequired(5); // Default to 5 if not provided
        }
        
        if (projectDto.getDeadline() != null) {
            project.setDeadline(projectDto.getDeadline());
        }

        // Process and set skills
        Set<Skill> skills = new HashSet<>();
        if (projectDto.getSkills() != null && !projectDto.getSkills().isEmpty()) {
            for (SkillDto skillDto : projectDto.getSkills()) {
                if (skillDto.getName() != null && !skillDto.getName().trim().isEmpty()) {
                    final String skillName = skillDto.getName().trim();
                    Skill skill = skillRepository.findByName(skillName)
                            .orElseGet(() -> {
                                Skill newSkill = new Skill();
                                newSkill.setName(skillName);
                                return skillRepository.save(newSkill);
                            });
                    skills.add(skill);
                }
            }
        }
        project.setSkills(skills);

        Project saved = projectRepository.save(project);
        
        // Add creator as a ProjectMember with LEADER role
        ProjectMember creatorMember = new ProjectMember();
        creatorMember.setProject(saved);
        creatorMember.setUser(creator);
        creatorMember.setRole(ProjectMember.Role.LEADER);
        projectMemberRepository.save(creatorMember);
        
        // Trigger lazy loading for skills
        if (saved.getSkills() != null) {
            saved.getSkills().size();
        }
        
        // Get member IDs from ProjectMemberRepository
        ProjectDto dto = projectMapper.toDto(saved);
        List<ProjectMember> members = projectMemberRepository.findByProject(saved);
        Set<Long> memberIds = members.stream()
            .map(m -> m.getUser().getUserId())
            .collect(Collectors.toSet());
        dto.setMemberIds(memberIds);
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        try {
            // Fetch all projects - the ProjectStatusConverter will handle case conversion
            List<Project> allProjects = projectRepository.findAll();
            
            // Initialize skills and members for each project
            for (Project project : allProjects) {
                // Initialize skills if null
                if (project.getSkills() == null) {
                    project.setSkills(new HashSet<>());
                } else {
                    // Trigger lazy loading by accessing the collection
                    try {
                        project.getSkills().size();
                    } catch (Exception e) {
                        // If lazy loading fails, set empty set
                        project.setSkills(new HashSet<>());
                    }
                }
                
                // Initialize members as empty set
                project.setMembers(new HashSet<>());
            }
            
            // Map to DTOs and populate member IDs from ProjectMemberRepository
            List<ProjectDto> dtos = new ArrayList<>();
            for (Project project : allProjects) {
                try {
                    // Filter out projects that couldn't be loaded properly
                    project.getProjectId();
                    project.getStatus();
                    
                    ProjectDto dto = projectMapper.toDto(project);
                    
                    // Get member IDs from ProjectMemberRepository
                    List<ProjectMember> members = projectMemberRepository.findByProject(project);
                    Set<Long> memberIds = members.stream()
                        .map(m -> m.getUser().getUserId())
                        .collect(Collectors.toSet());
                    dto.setMemberIds(memberIds);
                    
                    dtos.add(dto);
                } catch (Exception e) {
                    System.err.println("Error mapping project " + project.getProjectId() + ": " + e.getMessage());
                    e.printStackTrace();
                    // Return a minimal DTO to avoid breaking the entire response
                    ProjectDto dto = new ProjectDto();
                    dto.setProjectId(project.getProjectId());
                    dto.setTitle(project.getTitle() != null ? project.getTitle() : "Untitled");
                    dto.setDescription(project.getDescription() != null ? project.getDescription() : "");
                    try {
                        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : "OPEN");
                    } catch (Exception statusEx) {
                        dto.setStatus("OPEN");
                    }
                    dto.setSkills(new HashSet<>());
                    dto.setMemberIds(new HashSet<>());
                    dtos.add(dto);
                }
            }
            return dtos;
        } catch (Exception e) {
            System.err.println("Error fetching all projects: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of throwing to avoid breaking the frontend
            return new java.util.ArrayList<>();
        }
    }

    @Override
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        ProjectDto dto = projectMapper.toDto(project);
        
        // Get member IDs from ProjectMemberRepository
        List<ProjectMember> members = projectMemberRepository.findByProject(project);
        Set<Long> memberIds = members.stream()
            .map(m -> m.getUser().getUserId())
            .collect(Collectors.toSet());
        dto.setMemberIds(memberIds);
        
        return dto;
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
        
        // Update membersRequired and deadline if provided
        if (projectDto.getMembersRequired() != null) {
            project.setMembersRequired(projectDto.getMembersRequired());
        }
        if (projectDto.getDeadline() != null) {
            project.setDeadline(projectDto.getDeadline());
        }
        
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

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDto> searchProjects(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProjects();
        }
        
        String searchQuery = query.trim();
        List<Project> projects = projectRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            searchQuery, searchQuery
        );
        
        // Initialize skills and members for each project
        for (Project project : projects) {
            if (project.getSkills() == null) {
                project.setSkills(new HashSet<>());
            } else {
                try {
                    project.getSkills().size();
                } catch (Exception e) {
                    project.setSkills(new HashSet<>());
                }
            }
        }
        
        // Map to DTOs and populate member IDs from ProjectMemberRepository
        List<ProjectDto> dtos = new ArrayList<>();
        for (Project project : projects) {
            ProjectDto dto = projectMapper.toDto(project);
            
            // Get member IDs from ProjectMemberRepository
            List<ProjectMember> members = projectMemberRepository.findByProject(project);
            Set<Long> memberIds = members.stream()
                .map(m -> m.getUser().getUserId())
                .collect(Collectors.toSet());
            dto.setMemberIds(memberIds);
            
            dtos.add(dto);
        }
        return dtos;
    }

}

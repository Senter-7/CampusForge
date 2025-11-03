package com.campusconnect.service;

import com.campusconnect.dto.ProjectMemberDto;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.ProjectMember;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.mapper.ProjectMemberMapper;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectMemberServiceImpl implements ProjectMemberService {

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<ProjectMemberDto> getMembersByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        return projectMemberRepository.findByProject(project)
                .stream()
                .map(ProjectMemberMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
     public ProjectMemberDto addMember(Long projectId, Long userId, Long requesterId, String role) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        // Only project owner can add new members
        if (!project.getCreator().getUserId().equals(requesterId)) {
                throw new AccessDeniedException("Access denied: Only the project owner can add members.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        boolean alreadyExists = projectMemberRepository.existsByProjectAndUser(project, user);
        if (alreadyExists) {
                throw new RuntimeException("This user is already a member of the project.");
        }

        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(user);

        // ✅ Enum-safe assignment
        ProjectMember.Role memberRole;
        try {
                memberRole = (role != null) ? ProjectMember.Role.valueOf(role.toUpperCase()) : ProjectMember.Role.MEMBER;
        } catch (IllegalArgumentException e) {
                memberRole = ProjectMember.Role.MEMBER;
        }

        member.setRole(memberRole);

        ProjectMember saved = projectMemberRepository.save(member);
        return ProjectMemberMapper.toDto(saved);
    }

    @Override
    public void removeMember(Long projectId, Long userId, Long ownerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        // Verify project owner
        if (!project.getCreator().getUserId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied: Only the project owner can remove members.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        ProjectMember member = projectMemberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this project."));

        projectMemberRepository.delete(member);
    }
}


package com.campusconnect.repository;

import com.campusconnect.entity.ProjectMember;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    // Get all members of a project
    List<ProjectMember> findByProject(Project project);

    // Get all projects a user is part of
    List<ProjectMember> findByUser(User user);

    // To check if a user already joined a project
    boolean existsByProjectAndUser(Project project, User user);

    // Find member by project and user
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);

    // Count projects for a user
    long countByUser_UserId(Long userId);
}

package com.campusconnect.repository;

import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Find all projects where the given user is a member
    List<Project> findByMembersContaining(User user);

    @Query("SELECT p FROM Project p JOIN ProjectMember pm ON p = pm.project WHERE pm.user.userId = :userId")
    List<Project> findAllByUserId(@Param("userId") Long userId);

    
}

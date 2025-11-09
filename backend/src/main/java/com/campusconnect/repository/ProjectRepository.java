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

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.skills")
    List<Project> findAllWithSkills();
    
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members WHERE p.projectId IN :ids")
    List<Project> findAllWithMembersByIds(@Param("ids") List<Long> projectIds);
    
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.skills WHERE p.projectId = :id")
    java.util.Optional<Project> findByIdWithSkills(@Param("id") Long id);
    
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members WHERE p.projectId = :id")
    java.util.Optional<Project> findByIdWithMembers(@Param("id") Long id);

    @Query("SELECT p FROM Project p JOIN ProjectMember pm ON p = pm.project WHERE pm.user.userId = :userId")
    List<Project> findAllByUserId(@Param("userId") Long userId);
    List<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
    
    // Native query to fix status values in database
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "UPDATE projects SET status = 'OPEN' WHERE LOWER(status) = 'open'", nativeQuery = true)
    void fixStatusValues();
    
}

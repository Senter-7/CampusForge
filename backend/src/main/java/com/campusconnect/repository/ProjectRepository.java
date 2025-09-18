package com.campusconnect.repository;

import com.campusconnect.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT p FROM Project p WHERE p.skills LIKE %?1% AND p.interests LIKE %?2%")
    List<Project> findBySkillsAndInterests(String skills, String interests);
}

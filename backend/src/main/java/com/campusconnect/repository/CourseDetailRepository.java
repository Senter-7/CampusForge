package com.campusconnect.repository;

import com.campusconnect.entity.CourseDetail;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseDetailRepository extends JpaRepository<CourseDetail, Long> {
    List<CourseDetail> findByProfessor(Professor professor);
    List<CourseDetail> findByUniversity(University university);
    
    // Find by university and code (for unique constraint check)
    Optional<CourseDetail> findByUniversityAndCode(University university, String code);
    boolean existsByUniversityAndCode(University university, String code);
    
    // Search methods
    List<CourseDetail> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    List<CourseDetail> findByCodeContainingIgnoreCase(String code);
    
    // Find by professor
    @Query("SELECT cd FROM CourseDetail cd WHERE cd.professor = :professor")
    List<CourseDetail> findByProfessorId(@Param("professor") Professor professor);
}


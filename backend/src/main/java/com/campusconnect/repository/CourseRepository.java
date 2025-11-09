package com.campusconnect.repository;

import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByProfessor(Professor professor);
    List<Course> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    boolean existsByNameIgnoreCaseAndProfessor(String name, Professor professor);
    Optional<Course> findByNameIgnoreCaseAndProfessor(String name, Professor professor);
}

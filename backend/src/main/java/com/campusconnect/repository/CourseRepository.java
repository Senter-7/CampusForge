package com.campusconnect.repository;

import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByProfessor(Professor professor);
}

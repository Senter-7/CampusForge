package com.campusconnect.repository;

import com.campusconnect.entity.Rating;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByUser(User user);
    List<Rating> findByProfessor(Professor professor);
    List<Rating> findByCourse(Course course);
    List<Rating> findByProfessorAndCourse(Professor professor, Course course);

}

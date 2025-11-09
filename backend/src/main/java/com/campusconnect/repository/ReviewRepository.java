package com.campusconnect.repository;

import com.campusconnect.entity.Review;
import com.campusconnect.entity.CourseDetail;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByCourseDetail(CourseDetail courseDetail);
    List<Review> findByProfessor(Professor professor);
    List<Review> findByUser(User user);
    List<Review> findByRating_RatingId(Long ratingId);
    List<Review> findByCourseDetail_CourseId(Long courseDetailId);
    List<Review> findByProfessor_ProfessorId(Long professorId);
}


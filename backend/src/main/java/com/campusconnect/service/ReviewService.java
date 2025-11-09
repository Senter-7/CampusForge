package com.campusconnect.service;

import com.campusconnect.dto.ReviewDto;
import java.util.List;

public interface ReviewService {
    ReviewDto createReview(ReviewDto reviewDto);
    ReviewDto updateReview(Long reviewId, ReviewDto reviewDto);
    void deleteReview(Long reviewId);
    List<ReviewDto> getReviewsByCourseDetail(Long courseDetailId);
    List<ReviewDto> getReviewsByProfessor(Long professorId);
    List<ReviewDto> getReviewsByUser(Long userId);
    ReviewDto getReviewById(Long reviewId);
    ReviewDto markReviewHelpful(Long reviewId);
}


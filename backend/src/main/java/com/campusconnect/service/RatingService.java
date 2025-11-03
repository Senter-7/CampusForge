package com.campusconnect.service;

import com.campusconnect.dto.RatingDto;
import java.util.List;

public interface RatingService {
    RatingDto createRating(RatingDto ratingDto);
    RatingDto updateRating(Long ratingId, RatingDto ratingDto);
    void deleteRating(Long ratingId);

    List<RatingDto> getAllRatings();
    List<RatingDto> getRatingsByUser(Long userId);
    List<RatingDto> getRatingsByProfessor(Long professorId);
    List<RatingDto> getRatingsByCourse(Long courseId);

    Double getAverageRatingForProfessor(Long professorId);
    Double getAverageRatingForCourse(Long courseId);
}

package com.campusconnect.mapper;

import com.campusconnect.dto.RatingDto;
import com.campusconnect.entity.Rating;
import org.springframework.stereotype.Component;

@Component
public class RatingMapper {

    // Convert Entity → DTO
    public RatingDto toDto(Rating rating) {
        if (rating == null) return null;

        RatingDto dto = new RatingDto();
        dto.setRatingId(rating.getRatingId());
        dto.setUserId(rating.getUser().getUserId());
        if (rating.getProfessor() != null)
            dto.setProfessorId(rating.getProfessor().getProfessorId());
        if (rating.getCourse() != null)
            dto.setCourseId(rating.getCourse().getCourseId());
        dto.setRatingValue(rating.getRatingValue());
        dto.setComment(rating.getComment());
        dto.setCreatedAt(rating.getCreatedAt());

        return dto;
    }

    // Convert DTO → Entity
    public Rating toEntity(RatingDto dto) {
        if (dto == null) return null;

        Rating rating = new Rating();
        rating.setRatingId(dto.getRatingId());
        rating.setRatingValue(dto.getRatingValue());
        rating.setComment(dto.getComment());
        rating.setCreatedAt(dto.getCreatedAt());
        // Note: user, professor, and course references 
        // will be set in the service layer after fetching entities by ID

        return rating;
    }
}

package com.campusconnect.mapper;

import com.campusconnect.dto.CourseDetailDto;
import com.campusconnect.entity.CourseDetail;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.University;
import org.springframework.stereotype.Component;

@Component
public class CourseDetailMapper {

    // Entity → DTO
    public CourseDetailDto toDto(CourseDetail courseDetail) {
        if (courseDetail == null) return null;

        CourseDetailDto dto = new CourseDetailDto();
        dto.setCourseId(courseDetail.getCourseId());
        dto.setCode(courseDetail.getCode());
        dto.setName(courseDetail.getName());
        dto.setCredits(courseDetail.getCredits());
        dto.setDescription(courseDetail.getDescription());
        
        // Overall stats
        dto.setRating(courseDetail.getRating());
        dto.setReviews(courseDetail.getReviews());
        dto.setDifficulty(courseDetail.getDifficulty());
        dto.setWorkload(courseDetail.getWorkload());
        dto.setEnrolled(courseDetail.getEnrolled());
        
        // Rating categories
        dto.setRatingContent(courseDetail.getRatingContent());
        dto.setRatingTeaching(courseDetail.getRatingTeaching());
        dto.setRatingAssignments(courseDetail.getRatingAssignments());
        dto.setRatingExams(courseDetail.getRatingExams());
        
        // JSON arrays
        dto.setTags(courseDetail.getTags());
        dto.setPrerequisites(courseDetail.getPrerequisites());
        
        // Map university information
        if (courseDetail.getUniversity() != null) {
            dto.setUniversityId(courseDetail.getUniversity().getUniversityId());
            dto.setUniversityName(courseDetail.getUniversity().getName());
        }
        
        // Map professor information
        if (courseDetail.getProfessor() != null) {
            dto.setProfessorId(courseDetail.getProfessor().getProfessorId());
            dto.setProfessorName(courseDetail.getProfessor().getName());
        }
        
        return dto;
    }

    // DTO → Entity
    public CourseDetail toEntity(CourseDetailDto dto, University university, Professor professor) {
        if (dto == null) return null;

        CourseDetail courseDetail = new CourseDetail();
        courseDetail.setCourseId(dto.getCourseId());
        courseDetail.setCode(dto.getCode());
        courseDetail.setName(dto.getName());
        courseDetail.setCredits(dto.getCredits());
        courseDetail.setDescription(dto.getDescription());
        
        // Overall stats
        courseDetail.setRating(dto.getRating());
        courseDetail.setReviews(dto.getReviews());
        courseDetail.setDifficulty(dto.getDifficulty());
        courseDetail.setWorkload(dto.getWorkload());
        courseDetail.setEnrolled(dto.getEnrolled());
        
        // Rating categories
        courseDetail.setRatingContent(dto.getRatingContent());
        courseDetail.setRatingTeaching(dto.getRatingTeaching());
        courseDetail.setRatingAssignments(dto.getRatingAssignments());
        courseDetail.setRatingExams(dto.getRatingExams());
        
        // JSON arrays
        courseDetail.setTags(dto.getTags());
        courseDetail.setPrerequisites(dto.getPrerequisites());
        
        // Set relationships
        courseDetail.setUniversity(university);
        courseDetail.setProfessor(professor);
        
        return courseDetail;
    }
}


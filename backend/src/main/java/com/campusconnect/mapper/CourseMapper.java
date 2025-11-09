package com.campusconnect.mapper;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    // 🔄 Entity → DTO
    public CourseDto toDto(Course course) {
        if (course == null) return null;

        CourseDto dto = new CourseDto();
        dto.setCourseId(course.getCourseId());
        dto.setName(course.getName());
        dto.setDescription(course.getDescription());
        
        // Map professor information
        if (course.getProfessor() != null) {
            dto.setProfessorId(course.getProfessor().getProfessorId());
            dto.setProfessorName(course.getProfessor().getName());
        }
        
        // Map university information
        if (course.getUniversity() != null) {
            dto.setUniversityId(course.getUniversity().getUniversityId());
            dto.setUniversityName(course.getUniversity().getName());
        }
        
        return dto;
    }

    // 🔄 DTO → Entity
    public Course toEntity(CourseDto dto, Professor professor) {
        if (dto == null) return null;

        Course course = new Course();
        course.setCourseId(dto.getCourseId());
        course.setName(dto.getName());
        course.setDescription(dto.getDescription());
        course.setProfessor(professor);
        return course;
    }
}

package com.campusconnect.service;

import com.campusconnect.dto.CourseDto;
import java.util.List;

public interface CourseService {
    CourseDto createCourse(CourseDto courseDto);
    List<CourseDto> getAllCourses();
    CourseDto getCourseById(Long id);
    List<CourseDto> getCoursesByProfessor(Long professorId);
    List<CourseDto> searchCourses(String query);
}

package com.campusconnect.service;

import com.campusconnect.dto.CourseDetailDto;
import java.util.List;

public interface CourseDetailService {
    CourseDetailDto createCourseDetail(CourseDetailDto courseDetailDto);
    List<CourseDetailDto> getAllCourseDetails();
    CourseDetailDto getCourseDetailById(Long id);
    List<CourseDetailDto> getCourseDetailsByProfessor(Long professorId);
    List<CourseDetailDto> getCourseDetailsByUniversity(Long universityId);
    List<CourseDetailDto> searchCourseDetails(String query);
    CourseDetailDto updateCourseDetail(Long id, CourseDetailDto courseDetailDto);
    void deleteCourseDetail(Long id);
}


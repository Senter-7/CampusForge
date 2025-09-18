package com.campusconnect.service;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.entity.Course;
import com.campusconnect.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public CourseDto rateCourse(Long id, int rating) {
        Course course = courseRepository.findById(id).orElseThrow();
        double newAvg = ((course.getAverageRating() * course.getRatingCount()) + rating) / (course.getRatingCount() + 1);
        course.setAverageRating(newAvg);
        course.setRatingCount(course.getRatingCount() + 1);
        courseRepository.save(course);
        return toDto(course);
    }

    private CourseDto toDto(Course course) {
        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setName(course.getName());
        dto.setAverageRating(course.getAverageRating());
        return dto;
    }
}
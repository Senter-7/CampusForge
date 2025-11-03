package com.campusconnect.service;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseServiceImpl implements CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Override
    public CourseDto createCourse(CourseDto courseDto) {
        Course course = new Course();
        course.setName(courseDto.getName());
        course.setDescription(courseDto.getDescription());

        if (courseDto.getProfessorId() != null) {
            Professor professor = professorRepository.findById(courseDto.getProfessorId())
                    .orElse(null);
            course.setProfessor(professor);
        }

        Course saved = courseRepository.save(course);
        return mapToDto(saved);
    }

    @Override
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public CourseDto getCourseById(Long id) {
        return courseRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Override
    public List<CourseDto> getCoursesByProfessor(Long professorId) {
        Professor professor = professorRepository.findById(professorId).orElse(null);
        if (professor == null) return List.of();

        return courseRepository.findByProfessor(professor).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private CourseDto mapToDto(Course course) {
        CourseDto dto = new CourseDto();
        dto.setCourseId(course.getCourseId());
        dto.setName(course.getName());
        dto.setDescription(course.getDescription());
        dto.setProfessorId(course.getProfessor() != null ? course.getProfessor().getProfessorId() : null);
        return dto;
    }
}

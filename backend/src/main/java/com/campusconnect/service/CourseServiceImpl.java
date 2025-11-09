package com.campusconnect.service;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.University;
import com.campusconnect.mapper.CourseMapper;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.ProfessorRepository;
import com.campusconnect.repository.UniversityRepository;
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

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private CourseMapper courseMapper;

    @Override
    public CourseDto createCourse(CourseDto courseDto) {
        if (courseDto.getName() == null || courseDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Course name cannot be empty");
        }

        Professor professor = null;
        if (courseDto.getProfessorId() != null) {
            professor = professorRepository.findById(courseDto.getProfessorId())
                    .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
        }

        // Check for duplicate course (same name and professor combination)
        if (professor != null) {
            if (courseRepository.existsByNameIgnoreCaseAndProfessor(
                    courseDto.getName().trim(), professor)) {
                throw new IllegalArgumentException(
                    "A course with this name already exists for this professor");
            }
        }

        University university = null;
        if (courseDto.getUniversityId() != null) {
            university = universityRepository.findById(courseDto.getUniversityId())
                    .orElse(null);
        }

        Course course = courseMapper.toEntity(courseDto, professor);
        course.setName(courseDto.getName().trim());
        course.setUniversity(university);
        Course saved = courseRepository.save(course);
        return courseMapper.toDto(saved);
    }

    @Override
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CourseDto getCourseById(Long id) {
        return courseRepository.findById(id)
                .map(courseMapper::toDto)
                .orElse(null);
    }

    @Override
    public List<CourseDto> getCoursesByProfessor(Long professorId) {
        Professor professor = professorRepository.findById(professorId).orElse(null);
        if (professor == null) return List.of();

        return courseRepository.findByProfessor(professor).stream()
                .map(courseMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseDto> searchCourses(String query) {
        return courseRepository.findAll().stream()
                .filter(c -> c.getName().toLowerCase().contains(query.toLowerCase()) ||
                        (c.getDescription() != null && c.getDescription().toLowerCase().contains(query.toLowerCase())))
                .map(courseMapper::toDto)
                .collect(Collectors.toList());
    }
}

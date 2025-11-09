package com.campusconnect.service;

import com.campusconnect.dto.CourseDetailDto;
import com.campusconnect.entity.CourseDetail;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.University;
import com.campusconnect.mapper.CourseDetailMapper;
import com.campusconnect.repository.CourseDetailRepository;
import com.campusconnect.repository.ProfessorRepository;
import com.campusconnect.repository.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseDetailServiceImpl implements CourseDetailService {

    @Autowired
    private CourseDetailRepository courseDetailRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private CourseDetailMapper courseDetailMapper;

    @Override
    public CourseDetailDto createCourseDetail(CourseDetailDto courseDetailDto) {
        if (courseDetailDto.getCode() == null || courseDetailDto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Course code cannot be empty");
        }
        if (courseDetailDto.getName() == null || courseDetailDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Course name cannot be empty");
        }
        if (courseDetailDto.getUniversityId() == null) {
            throw new IllegalArgumentException("University ID is required");
        }

        University university = universityRepository.findById(courseDetailDto.getUniversityId())
                .orElseThrow(() -> new IllegalArgumentException("University not found"));

        // Check for duplicate course code within the same university
        if (courseDetailRepository.existsByUniversityAndCode(university, courseDetailDto.getCode().trim())) {
            throw new IllegalArgumentException(
                "A course with code '" + courseDetailDto.getCode() + "' already exists at this university");
        }

        Professor professor = null;
        if (courseDetailDto.getProfessorId() != null) {
            professor = professorRepository.findById(courseDetailDto.getProfessorId())
                    .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
        }

        CourseDetail courseDetail = courseDetailMapper.toEntity(courseDetailDto, university, professor);
        courseDetail.setCode(courseDetailDto.getCode().trim());
        courseDetail.setName(courseDetailDto.getName().trim());
        
        CourseDetail saved = courseDetailRepository.save(courseDetail);
        
        // Note: We don't create a Course entry here anymore
        // RatingService will create it on-demand when needed
        // This avoids AUTO_INCREMENT issues and ID conflicts
        
        return courseDetailMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDetailDto> getAllCourseDetails() {
        return courseDetailRepository.findAll().stream()
                .map(courseDetailMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CourseDetailDto getCourseDetailById(Long id) {
        return courseDetailRepository.findById(id)
                .map(courseDetailMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDetailDto> getCourseDetailsByProfessor(Long professorId) {
        Professor professor = professorRepository.findById(professorId).orElse(null);
        if (professor == null) return List.of();

        return courseDetailRepository.findByProfessor(professor).stream()
                .map(courseDetailMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDetailDto> getCourseDetailsByUniversity(Long universityId) {
        University university = universityRepository.findById(universityId).orElse(null);
        if (university == null) return List.of();

        return courseDetailRepository.findByUniversity(university).stream()
                .map(courseDetailMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDetailDto> searchCourseDetails(String query) {
        return courseDetailRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query)
                .stream()
                .map(courseDetailMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CourseDetailDto updateCourseDetail(Long id, CourseDetailDto courseDetailDto) {
        CourseDetail existing = courseDetailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course detail not found"));

        University university = existing.getUniversity();
        if (courseDetailDto.getUniversityId() != null && 
            !courseDetailDto.getUniversityId().equals(existing.getUniversity().getUniversityId())) {
            university = universityRepository.findById(courseDetailDto.getUniversityId())
                    .orElseThrow(() -> new IllegalArgumentException("University not found"));
        }

        Professor professor = existing.getProfessor();
        if (courseDetailDto.getProfessorId() != null) {
            if (courseDetailDto.getProfessorId().equals(0L)) {
                professor = null; // Remove professor
            } else if (!courseDetailDto.getProfessorId().equals(
                    existing.getProfessor() != null ? existing.getProfessor().getProfessorId() : null)) {
                professor = professorRepository.findById(courseDetailDto.getProfessorId())
                        .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
            }
        }

        // Check for duplicate code if code is being changed
        if (courseDetailDto.getCode() != null && 
            !courseDetailDto.getCode().trim().equals(existing.getCode())) {
            if (courseDetailRepository.existsByUniversityAndCode(university, courseDetailDto.getCode().trim())) {
                throw new IllegalArgumentException(
                    "A course with code '" + courseDetailDto.getCode() + "' already exists at this university");
            }
        }

        // Update fields
        if (courseDetailDto.getCode() != null) {
            existing.setCode(courseDetailDto.getCode().trim());
        }
        if (courseDetailDto.getName() != null) {
            existing.setName(courseDetailDto.getName().trim());
        }
        if (courseDetailDto.getCredits() != null) {
            existing.setCredits(courseDetailDto.getCredits());
        }
        if (courseDetailDto.getDescription() != null) {
            existing.setDescription(courseDetailDto.getDescription());
        }
        if (courseDetailDto.getRating() != null) {
            existing.setRating(courseDetailDto.getRating());
        }
        if (courseDetailDto.getReviews() != null) {
            existing.setReviews(courseDetailDto.getReviews());
        }
        if (courseDetailDto.getDifficulty() != null) {
            existing.setDifficulty(courseDetailDto.getDifficulty());
        }
        if (courseDetailDto.getWorkload() != null) {
            existing.setWorkload(courseDetailDto.getWorkload());
        }
        if (courseDetailDto.getEnrolled() != null) {
            existing.setEnrolled(courseDetailDto.getEnrolled());
        }
        if (courseDetailDto.getRatingContent() != null) {
            existing.setRatingContent(courseDetailDto.getRatingContent());
        }
        if (courseDetailDto.getRatingTeaching() != null) {
            existing.setRatingTeaching(courseDetailDto.getRatingTeaching());
        }
        if (courseDetailDto.getRatingAssignments() != null) {
            existing.setRatingAssignments(courseDetailDto.getRatingAssignments());
        }
        if (courseDetailDto.getRatingExams() != null) {
            existing.setRatingExams(courseDetailDto.getRatingExams());
        }
        if (courseDetailDto.getTags() != null) {
            existing.setTags(courseDetailDto.getTags());
        }
        if (courseDetailDto.getPrerequisites() != null) {
            existing.setPrerequisites(courseDetailDto.getPrerequisites());
        }

        existing.setUniversity(university);
        existing.setProfessor(professor);

        CourseDetail updated = courseDetailRepository.save(existing);
        return courseDetailMapper.toDto(updated);
    }

    @Override
    public void deleteCourseDetail(Long id) {
        if (!courseDetailRepository.existsById(id)) {
            throw new IllegalArgumentException("Course detail not found");
        }
        courseDetailRepository.deleteById(id);
    }
}


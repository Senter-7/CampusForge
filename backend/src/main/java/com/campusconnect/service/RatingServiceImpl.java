package com.campusconnect.service;

import com.campusconnect.dto.RatingDto;
import com.campusconnect.entity.*;
import com.campusconnect.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final ProfessorRepository professorRepository;
    private final CourseRepository courseRepository;

    // -------------------------------
    // CREATE
    // -------------------------------
    @Override
    public RatingDto createRating(RatingDto ratingDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = auth.getName();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));

        // Prevent duplicate ratings by the same user
        if (ratingDto.getProfessorId() != null) {
            List<Rating> existing = ratingRepository.findByProfessor(new Professor(ratingDto.getProfessorId()))
                    .stream()
                    .filter(r -> r.getUser().getUserId().equals(user.getUserId()))
                    .toList();
            if (!existing.isEmpty()) {
                throw new IllegalStateException("You have already rated this professor.");
            }
        }
        if (ratingDto.getCourseId() != null) {
            List<Rating> existing = ratingRepository.findByCourse(new Course(ratingDto.getCourseId()))
                    .stream()
                    .filter(r -> r.getUser().getUserId().equals(user.getUserId()))
                    .toList();
            if (!existing.isEmpty()) {
                throw new IllegalStateException("You have already rated this course.");
            }
        }

        Rating rating = new Rating();
        rating.setUser(user);
        rating.setRatingValue(ratingDto.getRatingValue());
        rating.setComment(ratingDto.getComment());

        if (ratingDto.getProfessorId() != null) {
            Professor professor = professorRepository.findById(ratingDto.getProfessorId())
                    .orElseThrow(() -> new EntityNotFoundException("Professor not found"));
            rating.setProfessor(professor);
        }

        if (ratingDto.getCourseId() != null) {
            Course course = courseRepository.findById(ratingDto.getCourseId())
                    .orElseThrow(() -> new EntityNotFoundException("Course not found"));
            rating.setCourse(course);
        }

        Rating saved = ratingRepository.save(rating);
        return convertToDto(saved);
    }

    // -------------------------------
    // UPDATE
    // -------------------------------
    @Override
    public RatingDto updateRating(Long ratingId, RatingDto ratingDto) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new EntityNotFoundException("Rating not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = auth.getName();

        if (!rating.getUser().getEmail().equals(currentUserEmail)) {
            throw new SecurityException("You are not authorized to edit this rating.");
        }

        rating.setRatingValue(ratingDto.getRatingValue());
        rating.setComment(ratingDto.getComment());

        return convertToDto(ratingRepository.save(rating));
    }

    // -------------------------------
    // DELETE
    // -------------------------------
    @Override
    public void deleteRating(Long ratingId) {
        Rating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new EntityNotFoundException("Rating not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = auth.getName();

        if (!rating.getUser().getEmail().equals(currentUserEmail)) {
            throw new SecurityException("You are not authorized to delete this rating.");
        }

        ratingRepository.delete(rating);
    }

    // -------------------------------
    // FETCH METHODS
    // -------------------------------
    @Override
    public List<RatingDto> getAllRatings() {
        return ratingRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<RatingDto> getRatingsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return ratingRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<RatingDto> getRatingsByProfessor(Long professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new EntityNotFoundException("Professor not found"));
        return ratingRepository.findByProfessor(professor).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<RatingDto> getRatingsByCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        return ratingRepository.findByCourse(course).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // -------------------------------
    // AVERAGE CALCULATION
    // -------------------------------
    @Override
    public Double getAverageRatingForProfessor(Long professorId) {
        List<Rating> ratings = ratingRepository.findByProfessor(
                professorRepository.findById(professorId)
                        .orElseThrow(() -> new EntityNotFoundException("Professor not found"))
        );
        return ratings.isEmpty() ? 0.0 :
                ratings.stream().mapToInt(Rating::getRatingValue).average().orElse(0.0);
    }

    @Override
    public Double getAverageRatingForCourse(Long courseId) {
        List<Rating> ratings = ratingRepository.findByCourse(
                courseRepository.findById(courseId)
                        .orElseThrow(() -> new EntityNotFoundException("Course not found"))
        );
        return ratings.isEmpty() ? 0.0 :
                ratings.stream().mapToInt(Rating::getRatingValue).average().orElse(0.0);
    }

    // -------------------------------
    // PRIVATE HELPER
    // -------------------------------
    private RatingDto convertToDto(Rating rating) {
        RatingDto dto = new RatingDto();
        dto.setRatingId(rating.getRatingId());
        dto.setRatingValue(rating.getRatingValue());
        dto.setComment(rating.getComment());
        dto.setCreatedAt(rating.getCreatedAt());

        if (rating.getUser() != null) {
            dto.setUserId(rating.getUser().getUserId());
            dto.setUserName(rating.getUser().getName());
        }
        if (rating.getProfessor() != null) {
            dto.setProfessorId(rating.getProfessor().getProfessorId());
            dto.setProfessorName(rating.getProfessor().getName());
        }
        if (rating.getCourse() != null) {
            dto.setCourseId(rating.getCourse().getCourseId());
            dto.setCourseName(rating.getCourse().getName());
        }
        return dto;
    }
}

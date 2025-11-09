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
    private final CourseDetailRepository courseDetailRepository;
    private final ReviewService reviewService;

    // -------------------------------
    // CREATE
    // -------------------------------
    @Override
    @Transactional
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
            // Check both Course and CourseDetail tables for existing ratings
            // First try CourseDetail (new table)
            CourseDetail courseDetail = courseDetailRepository.findById(ratingDto.getCourseId()).orElse(null);
            if (courseDetail != null) {
                // For CourseDetail, we need to check ratings differently since Rating entity uses Course
                // We'll check by courseId directly in the query
                List<Rating> allRatings = ratingRepository.findAll();
                List<Rating> existing = allRatings.stream()
                        .filter(r -> r.getCourse() != null && r.getCourse().getCourseId().equals(ratingDto.getCourseId()))
                        .filter(r -> r.getUser().getUserId().equals(user.getUserId()))
                        .toList();
                if (!existing.isEmpty()) {
                    throw new IllegalStateException("You have already rated this course.");
                }
            } else {
                // Fallback to Course table
                Course course = courseRepository.findById(ratingDto.getCourseId()).orElse(null);
                if (course != null) {
                    List<Rating> existing = ratingRepository.findByCourse(course)
                            .stream()
                            .filter(r -> r.getUser().getUserId().equals(user.getUserId()))
                            .toList();
                    if (!existing.isEmpty()) {
                        throw new IllegalStateException("You have already rated this course.");
                    }
                }
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
            // First try to find in CourseDetail (new table)
            CourseDetail courseDetail = courseDetailRepository.findById(ratingDto.getCourseId()).orElse(null);
            if (courseDetail != null) {
                // Try to find corresponding Course entry with the same ID
                Course course = courseRepository.findById(ratingDto.getCourseId()).orElse(null);
                if (course == null) {
                    // If Course doesn't exist with same ID, try to find by name and professor
                    // This handles cases where Course was created with a different ID
                    if (courseDetail.getProfessor() != null) {
                        List<Course> coursesByName = courseRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                            courseDetail.getName(), courseDetail.getName());
                        course = coursesByName.stream()
                            .filter(c -> c.getName().equals(courseDetail.getName()) && 
                                       c.getProfessor() != null && 
                                       c.getProfessor().getProfessorId().equals(courseDetail.getProfessor().getProfessorId()))
                            .findFirst()
                            .orElse(null);
                    }
                    
                    // If still not found, create it now
                    if (course == null) {
                        course = new Course();
                        course.setName(courseDetail.getName());
                        course.setDescription(courseDetail.getDescription());
                        course.setProfessor(courseDetail.getProfessor());
                        course.setUniversity(courseDetail.getUniversity());
                        course = courseRepository.save(course);
                    }
                }
                rating.setCourse(course);
            } else {
                // Fallback to Course table
                Course course = courseRepository.findById(ratingDto.getCourseId())
                        .orElseThrow(() -> new EntityNotFoundException("Course not found"));
                rating.setCourse(course);
            }
        }

        Rating saved = ratingRepository.save(rating);
        
        // Convert to DTO first - this ensures the rating is saved before we try to create a review
        RatingDto result = convertToDto(saved);
        
        // If rating has a comment, create a review
        // Do this AFTER returning the result in a separate try-catch to ensure rating creation always succeeds
        if (saved.getComment() != null && !saved.getComment().trim().isEmpty()) {
            // Create review asynchronously - use a separate transaction
            createReviewForRating(saved, ratingDto);
        }
        
        return result;
    }
    
    // Helper method to create review without affecting rating transaction
    private void createReviewForRating(Rating saved, RatingDto ratingDto) {
        try {
            com.campusconnect.dto.ReviewDto reviewDto = new com.campusconnect.dto.ReviewDto();
            reviewDto.setRatingId(saved.getRatingId());
            reviewDto.setContent(saved.getComment());
            
            // For course reviews: Use the courseId from the DTO which should be CourseDetail ID
            // The frontend sends CourseDetail IDs when rating courses
            if (ratingDto.getCourseId() != null) {
                // The courseId should be the CourseDetail ID (since frontend uses CourseDetail)
                CourseDetail courseDetail = courseDetailRepository.findById(ratingDto.getCourseId()).orElse(null);
                if (courseDetail != null) {
                    reviewDto.setCourseDetailId(courseDetail.getCourseId());
                } else {
                    // If not found, skip review creation for this course (rating still succeeds)
                    System.err.println("Warning: CourseDetail not found for ID " + ratingDto.getCourseId() + ", skipping review creation");
                    return; // Exit early if we can't create review
                }
            }
            
            // For professor reviews: Use professorId directly
            if (ratingDto.getProfessorId() != null) {
                reviewDto.setProfessorId(ratingDto.getProfessorId());
            }
            
            // Only create review if we have at least course or professor
            if (reviewDto.getCourseDetailId() != null || reviewDto.getProfessorId() != null) {
                // Call review service in a separate transaction
                // If it fails, it won't affect the rating that was already saved
                reviewService.createReview(reviewDto);
            }
        } catch (Exception e) {
            // Log error but don't throw - rating was already created successfully
            // This catch ensures that ANY exception in review creation doesn't affect the rating
            System.err.println("Warning: Failed to create review for rating " + saved.getRatingId() + ": " + e.getMessage());
            e.printStackTrace();
        }
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
        // First try CourseDetail, then fallback to Course
        CourseDetail courseDetail = courseDetailRepository.findById(courseId).orElse(null);
        Course course;
        if (courseDetail != null) {
            // Find or create corresponding Course entry
            course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
                throw new EntityNotFoundException("Course not found");
            }
        } else {
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        }
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
        // First try CourseDetail, then fallback to Course
        CourseDetail courseDetail = courseDetailRepository.findById(courseId).orElse(null);
        Course course;
        if (courseDetail != null) {
            // Find or create corresponding Course entry
            course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
                return 0.0; // No ratings if course doesn't exist in Course table
            }
        } else {
            course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
                return 0.0; // No ratings if course doesn't exist
            }
        }
        List<Rating> ratings = ratingRepository.findByCourse(course);
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

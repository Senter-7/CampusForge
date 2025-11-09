package com.campusconnect.service;

import com.campusconnect.dto.ReviewDto;
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
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final CourseDetailRepository courseDetailRepository;
    private final ProfessorRepository professorRepository;

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public ReviewDto createReview(ReviewDto reviewDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new SecurityException("User not authenticated");
        }
        
        String currentUserEmail = auth.getName();

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));

        Review review = new Review();
        review.setUser(user);
        review.setContent(reviewDto.getContent());
        review.setTitle(reviewDto.getTitle());
        review.setHelpfulCount(0);

        // Link to rating if provided (optional, don't fail if not found)
        if (reviewDto.getRatingId() != null) {
            Rating rating = ratingRepository.findById(reviewDto.getRatingId()).orElse(null);
            if (rating != null) {
                review.setRating(rating);
            }
        }

        // Link to course detail if provided
        if (reviewDto.getCourseDetailId() != null) {
            CourseDetail courseDetail = courseDetailRepository.findById(reviewDto.getCourseDetailId()).orElse(null);
            if (courseDetail != null) {
                review.setCourseDetail(courseDetail);
            } else {
                throw new EntityNotFoundException("Course detail not found with ID: " + reviewDto.getCourseDetailId());
            }
        }

        // Link to professor if provided
        if (reviewDto.getProfessorId() != null) {
            Professor professor = professorRepository.findById(reviewDto.getProfessorId()).orElse(null);
            if (professor != null) {
                review.setProfessor(professor);
            } else {
                throw new EntityNotFoundException("Professor not found with ID: " + reviewDto.getProfessorId());
            }
        }

        // Ensure at least one target is set
        if (review.getCourseDetail() == null && review.getProfessor() == null) {
            throw new IllegalStateException("Review must be associated with either a course or a professor");
        }

        Review saved = reviewRepository.save(review);
        return convertToDto(saved);
    }

    @Override
    public ReviewDto updateReview(Long reviewId, ReviewDto reviewDto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = auth.getName();

        if (!review.getUser().getEmail().equals(currentUserEmail)) {
            throw new SecurityException("You are not authorized to edit this review");
        }

        if (reviewDto.getTitle() != null) {
            review.setTitle(reviewDto.getTitle());
        }
        if (reviewDto.getContent() != null) {
            review.setContent(reviewDto.getContent());
        }
        review.setUpdatedAt(java.time.LocalDateTime.now());

        return convertToDto(reviewRepository.save(review));
    }

    @Override
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = auth.getName();

        if (!review.getUser().getEmail().equals(currentUserEmail)) {
            throw new SecurityException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByCourseDetail(Long courseDetailId) {
        CourseDetail courseDetail = courseDetailRepository.findById(courseDetailId)
                .orElseThrow(() -> new EntityNotFoundException("Course detail not found"));
        return reviewRepository.findByCourseDetail(courseDetail).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByProfessor(Long professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new EntityNotFoundException("Professor not found"));
        return reviewRepository.findByProfessor(professor).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return reviewRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewDto getReviewById(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found"));
        return convertToDto(review);
    }

    @Override
    public ReviewDto markReviewHelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found"));
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        return convertToDto(reviewRepository.save(review));
    }

    private ReviewDto convertToDto(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setReviewId(review.getReviewId());
        dto.setContent(review.getContent());
        dto.setTitle(review.getTitle());
        dto.setHelpfulCount(review.getHelpfulCount());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());

        if (review.getUser() != null) {
            dto.setUserId(review.getUser().getUserId());
            dto.setUserName(review.getUser().getName());
        }

        if (review.getRating() != null) {
            dto.setRatingId(review.getRating().getRatingId());
            dto.setRatingValue(review.getRating().getRatingValue());
        }

        if (review.getCourseDetail() != null) {
            dto.setCourseDetailId(review.getCourseDetail().getCourseId());
            dto.setCourseDetailName(review.getCourseDetail().getName());
        }

        if (review.getProfessor() != null) {
            dto.setProfessorId(review.getProfessor().getProfessorId());
            dto.setProfessorName(review.getProfessor().getName());
        }

        return dto;
    }
}


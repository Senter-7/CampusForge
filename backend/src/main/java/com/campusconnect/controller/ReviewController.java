package com.campusconnect.controller;

import com.campusconnect.dto.ReviewDto;
import com.campusconnect.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ReviewDto> createReview(@RequestBody ReviewDto reviewDto) {
        return ResponseEntity.ok(reviewService.createReview(reviewDto));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewDto reviewDto) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, reviewDto));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<String> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok("Review deleted successfully");
    }

    @GetMapping("/course/{courseDetailId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByCourseDetail(@PathVariable Long courseDetailId) {
        return ResponseEntity.ok(reviewService.getReviewsByCourseDetail(courseDetailId));
    }

    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(reviewService.getReviewsByProfessor(professorId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> getReviewById(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.getReviewById(reviewId));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{reviewId}/helpful")
    public ResponseEntity<ReviewDto> markReviewHelpful(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.markReviewHelpful(reviewId));
    }
}


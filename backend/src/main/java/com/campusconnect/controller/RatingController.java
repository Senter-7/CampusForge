package com.campusconnect.controller;

import com.campusconnect.dto.RatingDto;
import com.campusconnect.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingDto> createRating(@RequestBody RatingDto ratingDto) {
        return ResponseEntity.ok(ratingService.createRating(ratingDto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RatingDto>> getRatingsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ratingService.getRatingsByUser(userId));
    }

    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<RatingDto>> getRatingsByProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(ratingService.getRatingsByProfessor(professorId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<RatingDto>> getRatingsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ratingService.getRatingsByCourse(courseId));
    }

    @GetMapping("/professor/{professorId}/average")
    public ResponseEntity<Double> getAverageRatingForProfessor(@PathVariable Long professorId) {
        return ResponseEntity.ok(ratingService.getAverageRatingForProfessor(professorId));
    }

    @GetMapping("/course/{courseId}/average")
    public ResponseEntity<Double> getAverageRatingForCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(ratingService.getAverageRatingForCourse(courseId));
    }

    @PutMapping("/{ratingId}")
    public ResponseEntity<RatingDto> updateRating(@PathVariable Long ratingId, @RequestBody RatingDto ratingDto) {
        return ResponseEntity.ok(ratingService.updateRating(ratingId, ratingDto));
    }

    @DeleteMapping("/{ratingId}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long ratingId) {
        ratingService.deleteRating(ratingId);
        return ResponseEntity.noContent().build();
    }
}

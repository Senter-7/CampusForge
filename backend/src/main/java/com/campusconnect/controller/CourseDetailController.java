package com.campusconnect.controller;

import com.campusconnect.dto.CourseDetailDto;
import com.campusconnect.service.CourseDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-details")
public class CourseDetailController {

    @Autowired
    private CourseDetailService courseDetailService;

    @PostMapping
    public ResponseEntity<CourseDetailDto> createCourseDetail(@RequestBody CourseDetailDto courseDetailDto) {
        try {
            CourseDetailDto created = courseDetailService.createCourseDetail(courseDetailDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<CourseDetailDto>> getAllCourseDetails() {
        List<CourseDetailDto> courseDetails = courseDetailService.getAllCourseDetails();
        return ResponseEntity.ok(courseDetails);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDetailDto> getCourseDetailById(@PathVariable Long id) {
        CourseDetailDto courseDetail = courseDetailService.getCourseDetailById(id);
        if (courseDetail == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(courseDetail);
    }

    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<CourseDetailDto>> getCourseDetailsByProfessor(@PathVariable Long professorId) {
        List<CourseDetailDto> courseDetails = courseDetailService.getCourseDetailsByProfessor(professorId);
        return ResponseEntity.ok(courseDetails);
    }

    @GetMapping("/university/{universityId}")
    public ResponseEntity<List<CourseDetailDto>> getCourseDetailsByUniversity(@PathVariable Long universityId) {
        List<CourseDetailDto> courseDetails = courseDetailService.getCourseDetailsByUniversity(universityId);
        return ResponseEntity.ok(courseDetails);
    }

    @GetMapping("/search")
    public ResponseEntity<List<CourseDetailDto>> searchCourseDetails(@RequestParam String query) {
        List<CourseDetailDto> courseDetails = courseDetailService.searchCourseDetails(query);
        return ResponseEntity.ok(courseDetails);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDetailDto> updateCourseDetail(
            @PathVariable Long id,
            @RequestBody CourseDetailDto courseDetailDto) {
        try {
            CourseDetailDto updated = courseDetailService.updateCourseDetail(id, courseDetailDto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourseDetail(@PathVariable Long id) {
        try {
            courseDetailService.deleteCourseDetail(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}


package com.campusconnect.controller;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public List<CourseDto> getAllCourses() {
        return courseService.getAllCourses();
    }

    @PostMapping("/rate/{id}")
    public ResponseEntity<CourseDto> rateCourse(@PathVariable Long id, @RequestParam int rating) {
        return ResponseEntity.ok(courseService.rateCourse(id, rating));
    }
}

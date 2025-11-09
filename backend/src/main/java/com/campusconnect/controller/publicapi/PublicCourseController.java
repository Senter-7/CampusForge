package com.campusconnect.controller.publicapi;

import com.campusconnect.dto.CourseDto;
import com.campusconnect.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    // 🔹 Public: get all courses
    @GetMapping
    public List<CourseDto> getAllCourses() {
        return courseService.getAllCourses();
    }

    // 🔹 Public: search courses by name or description
    @GetMapping("/search")
    public List<CourseDto> searchCourses(@RequestParam("q") String query) {
        return courseService.searchCourses(query);
    }
}

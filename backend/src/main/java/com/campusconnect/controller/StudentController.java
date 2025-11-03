package com.campusconnect.controller;

import com.campusconnect.dto.UserDto;
import com.campusconnect.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    @Autowired
    private StudentService studentService;

    // ✅ Get student profile
    @GetMapping("/profile/{id}")
    public ResponseEntity<UserDto> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getProfile(id));
    }

    // ✅ Update student profile
    @PutMapping("/profile/{id}")
    public ResponseEntity<UserDto> updateProfile(@PathVariable Long id, @RequestBody UserDto userDto) {
        return ResponseEntity.ok(studentService.updateProfile(id, userDto));
    }

    // ✅ (Optional) View student’s joined projects
    @GetMapping("/projects/{studentId}")
    public ResponseEntity<?> getProjects(@PathVariable Long studentId) {
        return ResponseEntity.ok(studentService.getStudentProjects(studentId));
    }

    // ✅ (Optional) Join project
    @PostMapping("/projects/join")
    public ResponseEntity<String> joinProject(@RequestParam Long studentId, @RequestParam Long projectId) {
        studentService.joinProject(studentId, projectId);
        return ResponseEntity.ok("Joined project successfully!");
    }
}

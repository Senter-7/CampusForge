package com.campusconnect.controller;

import com.campusconnect.dto.ProjectDto;
import com.campusconnect.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    public List<ProjectDto> getAllProjects() {
        return projectService.getAllProjects();
    }

    @GetMapping("/search")
    public List<ProjectDto> searchProjects(@RequestParam String skills, @RequestParam String interests) {
        return projectService.searchProjects(skills, interests);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> createProject(@RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.createProject(projectDto));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ProjectDto> joinProject(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(projectService.joinProject(id, userId));
    }
}

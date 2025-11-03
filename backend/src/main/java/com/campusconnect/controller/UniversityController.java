package com.campusconnect.controller;

import com.campusconnect.dto.UniversityDto;
import com.campusconnect.service.UniversityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityService universityService;

    // POST: Create new university
    @PostMapping
    public ResponseEntity<UniversityDto> createUniversity(@RequestBody UniversityDto dto) {
        return ResponseEntity.ok(universityService.createUniversity(dto));
    }

    // GET: Fetch all universities
    @GetMapping
    public ResponseEntity<List<UniversityDto>> getAllUniversities() {
        return ResponseEntity.ok(universityService.getAllUniversities());
    }

    // GET: Fetch a specific university by ID
    @GetMapping("/{id}")
    public ResponseEntity<UniversityDto> getUniversityById(@PathVariable Long id) {
        return ResponseEntity.ok(universityService.getUniversityById(id));
    }

    // PUT: Update a university
    @PutMapping("/{id}")
    public ResponseEntity<UniversityDto> updateUniversity(@PathVariable Long id, @RequestBody UniversityDto dto) {
        return ResponseEntity.ok(universityService.updateUniversity(id, dto));
    }

    // DELETE: Remove a university
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUniversity(@PathVariable Long id) {
        universityService.deleteUniversity(id);
        return ResponseEntity.noContent().build();
    }
}

package com.campusconnect.controller;

import com.campusconnect.dto.ProfessorDto;
import com.campusconnect.service.ProfessorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professors")
public class ProfessorController {

    @Autowired
    private ProfessorService professorService;

    // 🔹 Create or update professor
    @PostMapping
    public ResponseEntity<ProfessorDto> saveProfessor(@RequestBody ProfessorDto dto) {
        return ResponseEntity.ok(professorService.saveProfessor(dto));
    }

    // 🔹 Get all professors
    @GetMapping
    public ResponseEntity<List<ProfessorDto>> getAllProfessors() {
        return ResponseEntity.ok(professorService.getAllProfessors());
    }

    // 🔹 Get professor by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProfessorDto> getProfessorById(@PathVariable Long id) {
        return ResponseEntity.ok(professorService.getProfessorById(id));
    }

    // 🔹 Delete professor
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfessor(@PathVariable Long id) {
        professorService.deleteProfessor(id);
        return ResponseEntity.noContent().build();
    }
    
    
}




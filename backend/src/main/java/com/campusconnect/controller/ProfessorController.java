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

    @GetMapping
    public List<ProfessorDto> getAllProfessors() {
        return professorService.getAllProfessors();
    }

    @PostMapping("/rate/{id}")
    public ResponseEntity<ProfessorDto> rateProfessor(@PathVariable Long id, @RequestParam int rating) {
        return ResponseEntity.ok(professorService.rateProfessor(id, rating));
    }
}
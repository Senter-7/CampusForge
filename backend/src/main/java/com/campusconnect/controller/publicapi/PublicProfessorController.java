package com.campusconnect.controller.publicapi;

import com.campusconnect.dto.ProfessorDto;
import com.campusconnect.service.ProfessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public/professors")
@RequiredArgsConstructor
public class PublicProfessorController {

    private final ProfessorService professorService;

    // 🔹 Public: get all professors
    @GetMapping
    public ResponseEntity<List<ProfessorDto>> getAllProfessors() {
        return ResponseEntity.ok(professorService.getAllProfessors());
    }

    // 🔹 Public: search professors by name or department
    @GetMapping("/search")
    public ResponseEntity<List<ProfessorDto>> searchProfessors(@RequestParam("q") String query) {
        return ResponseEntity.ok(professorService.searchProfessors(query));
    }
}

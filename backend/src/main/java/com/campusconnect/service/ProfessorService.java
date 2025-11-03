package com.campusconnect.service;

import com.campusconnect.dto.ProfessorDto;
import com.campusconnect.entity.Professor;
import com.campusconnect.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    // ✅ Create or update a professor
    public ProfessorDto saveProfessor(ProfessorDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Professor name cannot be empty");
        }

        Professor professor = new Professor();
        if (dto.getProfessorId() != null) {
            professor = professorRepository.findById(dto.getProfessorId())
                    .orElse(new Professor());
        }

        professor.setName(dto.getName());
        professor.setDepartment(dto.getDepartment());
        professor.setEmail(dto.getEmail());

        Professor saved = professorRepository.save(professor);
        return toDto(saved);
    }

    // ✅ Fetch all professors
    public List<ProfessorDto> getAllProfessors() {
        return professorRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Get professor by ID
    public ProfessorDto getProfessorById(Long id) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
        return toDto(professor);
    }

    // ✅ Delete professor
    public void deleteProfessor(Long id) {
        if (!professorRepository.existsById(id)) {
            throw new IllegalArgumentException("Professor not found");
        }
        professorRepository.deleteById(id);
    }

    // 🔄 Helper: Entity → DTO
    private ProfessorDto toDto(Professor professor) {
        ProfessorDto dto = new ProfessorDto();
        dto.setProfessorId(professor.getProfessorId());
        dto.setName(professor.getName());
        dto.setDepartment(professor.getDepartment());
        dto.setEmail(professor.getEmail());
        return dto;
    }
}

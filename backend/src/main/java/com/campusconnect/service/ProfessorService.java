package com.campusconnect.service;

import com.campusconnect.dto.ProfessorDto;
import com.campusconnect.entity.Professor;
import com.campusconnect.entity.University;
import com.campusconnect.mapper.ProfessorMapper;
import com.campusconnect.repository.ProfessorRepository;
import com.campusconnect.repository.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private ProfessorMapper professorMapper;

    @Autowired
    private UniversityRepository universityRepository;

    // ✅ Create or update a professor
    public ProfessorDto saveProfessor(ProfessorDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Professor name cannot be empty");
        }

        // If this is a new professor (no ID), check for duplicates
        if (dto.getProfessorId() == null) {
            // Check for duplicate email (email is unique)
            if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
                if (professorRepository.existsByEmail(dto.getEmail().trim())) {
                    throw new IllegalArgumentException("A professor with this email already exists");
                }
            }
            
            // Check for duplicate name (optional - you might want to allow same names)
            // For now, we'll only check email as it's unique
        } else {
            // For updates, check if email is being changed and if new email already exists
            Professor existing = professorRepository.findById(dto.getProfessorId())
                    .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
            
            if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty() 
                    && !dto.getEmail().trim().equalsIgnoreCase(existing.getEmail())) {
                if (professorRepository.existsByEmail(dto.getEmail().trim())) {
                    throw new IllegalArgumentException("A professor with this email already exists");
                }
            }
        }

        Professor professor = dto.getProfessorId() != null
                ? professorRepository.findById(dto.getProfessorId()).orElse(new Professor())
                : new Professor();

        // Map updates from DTO to entity
        professor.setName(dto.getName().trim());
        professor.setDepartment(dto.getDepartment() != null ? dto.getDepartment().trim() : null);
        professor.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        
        // Set university if provided
        if (dto.getUniversityId() != null) {
            University university = universityRepository.findById(dto.getUniversityId())
                    .orElse(null);
            professor.setUniversity(university);
        }

        Professor saved = professorRepository.save(professor);
        return professorMapper.toDto(saved);
    }

    // ✅ Fetch all professors
    public List<ProfessorDto> getAllProfessors() {
        return professorRepository.findAll()
                .stream()
                .map(professorMapper::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Get professor by ID
    public ProfessorDto getProfessorById(Long id) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Professor not found"));
        return professorMapper.toDto(professor);
    }

    // ✅ Search professors (public endpoint)
    public List<ProfessorDto> searchProfessors(String query) {
        return professorRepository.findAll().stream()
                .filter(p -> p.getName().toLowerCase().contains(query.toLowerCase()) ||
                        (p.getDepartment() != null && p.getDepartment().toLowerCase().contains(query.toLowerCase())))
                .map(professorMapper::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Delete professor
    public void deleteProfessor(Long id) {
        if (!professorRepository.existsById(id)) {
            throw new IllegalArgumentException("Professor not found");
        }
        professorRepository.deleteById(id);
    }
}

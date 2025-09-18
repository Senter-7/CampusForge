
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

    public List<ProfessorDto> getAllProfessors() {
        return professorRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProfessorDto rateProfessor(Long id, int rating) {
        Professor professor = professorRepository.findById(id).orElseThrow();
        double newAvg = ((professor.getAverageRating() * professor.getRatingCount()) + rating) / (professor.getRatingCount() + 1);
        professor.setAverageRating(newAvg);
        professor.setRatingCount(professor.getRatingCount() + 1);
        professorRepository.save(professor);
        return toDto(professor);
    }

    private ProfessorDto toDto(Professor professor) {
        ProfessorDto dto = new ProfessorDto();
        dto.setId(professor.getId());
        dto.setName(professor.getName());
        dto.setAverageRating(professor.getAverageRating());
        return dto;
    }
}

package com.campusconnect.mapper;

import com.campusconnect.dto.ProfessorDto;
import com.campusconnect.entity.Professor;
import org.springframework.stereotype.Component;

@Component
public class ProfessorMapper {

    // 🔄 Entity → DTO
    public ProfessorDto toDto(Professor professor) {
        if (professor == null) return null;

        ProfessorDto dto = new ProfessorDto();
        dto.setProfessorId(professor.getProfessorId());
        dto.setName(professor.getName());
        dto.setDepartment(professor.getDepartment());
        dto.setEmail(professor.getEmail());
        
        // Map university information
        if (professor.getUniversity() != null) {
            dto.setUniversityId(professor.getUniversity().getUniversityId());
            dto.setUniversityName(professor.getUniversity().getName());
        }
        
        return dto;
    }

    // 🔄 DTO → Entity
    public Professor toEntity(ProfessorDto dto) {
        if (dto == null) return null;

        Professor professor = new Professor();
        professor.setProfessorId(dto.getProfessorId());
        professor.setName(dto.getName());
        professor.setDepartment(dto.getDepartment());
        professor.setEmail(dto.getEmail());
        // Note: University will be set separately in the service layer
        return professor;
    }
}

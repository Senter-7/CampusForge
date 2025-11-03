package com.campusconnect.service;

import com.campusconnect.dto.UniversityDto;
import com.campusconnect.entity.University;
import com.campusconnect.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UniversityService {

    private final UniversityRepository universityRepository;

    // Convert entity → DTO
    private UniversityDto toDto(University university) {
        return UniversityDto.builder()
                .universityId(university.getUniversityId())
                .name(university.getName())
                .location(university.getLocation())
                .city(university.getCity())
                .state(university.getState())
                .country(university.getCountry())
                .build();
    }

    // Convert DTO → entity
    private University toEntity(UniversityDto dto) {
        return University.builder()
                .universityId(dto.getUniversityId())
                .name(dto.getName())
                .location(dto.getLocation())
                .city(dto.getCity())
                .state(dto.getState())
                .country(dto.getCountry())
                .build();
    }

    // Create / Add new university
    public UniversityDto createUniversity(UniversityDto dto) {
        University university = toEntity(dto);
        return toDto(universityRepository.save(university));
    }

    // Get all universities
    public List<UniversityDto> getAllUniversities() {
        return universityRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Get university by ID
    public UniversityDto getUniversityById(Long id) {
        return universityRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("University not found with ID: " + id));
    }

    // Update university
    public UniversityDto updateUniversity(Long id, UniversityDto dto) {
        University existing = universityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("University not found with ID: " + id));

        existing.setName(dto.getName());
        existing.setLocation(dto.getLocation());
        existing.setCity(dto.getCity());
        existing.setState(dto.getState());
        existing.setCountry(dto.getCountry());

        return toDto(universityRepository.save(existing));
    }

    // Delete university
    public void deleteUniversity(Long id) {
        if (!universityRepository.existsById(id)) {
            throw new RuntimeException("University not found with ID: " + id);
        }
        universityRepository.deleteById(id);
    }
}

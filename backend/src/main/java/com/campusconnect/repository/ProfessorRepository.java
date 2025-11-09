package com.campusconnect.repository;

import com.campusconnect.entity.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {
    Optional<Professor> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Professor> findByNameIgnoreCase(String name);
}

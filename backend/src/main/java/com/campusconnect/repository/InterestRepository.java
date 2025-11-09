package com.campusconnect.repository;

import com.campusconnect.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    boolean existsByName(String name);
    Optional<Interest> findByName(String name);
}
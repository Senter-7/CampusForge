package com.campusconnect.repository;

import com.campusconnect.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    boolean existsByName(String name);
}
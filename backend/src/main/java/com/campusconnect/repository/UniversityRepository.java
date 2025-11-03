package com.campusconnect.repository;

import com.campusconnect.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;


@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {

    // Optional custom finder methods
   
    Optional<University> findByName(String name);

}

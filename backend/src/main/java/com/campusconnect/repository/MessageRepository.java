package com.campusconnect.repository;

import com.campusconnect.entity.Message;
import com.campusconnect.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByProjectOrderByCreatedAtAsc(Project project);
    
    @Query("SELECT m FROM Message m WHERE m.sender.userId = :userId ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByUser(@Param("userId") Long userId);

    

}

package com.campusconnect.repository;

import com.campusconnect.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByProjectId(Long projectId);
}

package com.campusconnect.repository;

import com.campusconnect.entity.CollaborationRequest;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CollaborationRequestRepository extends JpaRepository<CollaborationRequest, Long> {
    List<CollaborationRequest> findByProject(Project project);
    List<CollaborationRequest> findByStudent(User student);
    boolean existsByProjectAndStudent(Project project, User student);

    @Query("SELECT cr FROM CollaborationRequest cr WHERE cr.student.userId = :userId AND cr.status = 'PENDING'")
    List<CollaborationRequest> findPendingRequestsByUserId(@Param("userId") Long userId);
}

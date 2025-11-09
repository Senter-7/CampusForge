package com.campusconnect.repository;

import com.campusconnect.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject_ProjectId(Long projectId);
    List<Task> findByAssignedTo_UserId(Long userId);
    List<Task> findByProject_ProjectIdAndStatus(Long projectId, Task.Status status);

    List<Task> findByAssignedTo_UserIdAndStatus(Long userId, Task.Status status);

    List<Task> findByProject_ProjectIdOrderByPriorityDesc(Long projectId);

    // Eagerly fetch task with project, createdBy, and assignedTo for authorization checks
    @Query("SELECT t FROM Task t " +
           "LEFT JOIN FETCH t.project p " +
           "LEFT JOIN FETCH t.createdBy " +
           "LEFT JOIN FETCH t.assignedTo " +
           "WHERE t.taskId = :taskId")
    Optional<Task> findByIdWithRelations(@Param("taskId") Long taskId);

}

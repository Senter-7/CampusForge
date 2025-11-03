package com.campusconnect.repository;

import com.campusconnect.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject_ProjectId(Long projectId);
    List<Task> findByAssignedTo_UserId(Long userId);
    List<Task> findByProject_ProjectIdAndStatus(Long projectId, Task.Status status);

    List<Task> findByAssignedTo_UserIdAndStatus(Long userId, Task.Status status);

    List<Task> findByProject_ProjectIdOrderByPriorityDesc(Long projectId);

}

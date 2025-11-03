package com.campusconnect.repository;

import com.campusconnect.entity.Attachment;
import com.campusconnect.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByProject(Project project);
}

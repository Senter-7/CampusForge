package com.campusconnect.service;

import com.campusconnect.dto.AttachmentDto;
import java.util.List;

public interface AttachmentService {
    AttachmentDto uploadAttachment(AttachmentDto attachmentDto);
    List<AttachmentDto> getAttachmentsByProject(Long projectId);
    AttachmentDto getAttachmentById(Long attachmentId);
}

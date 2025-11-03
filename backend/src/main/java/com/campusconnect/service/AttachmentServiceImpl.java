package com.campusconnect.service;

import com.campusconnect.dto.AttachmentDto;
import com.campusconnect.entity.*;
import com.campusconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public AttachmentDto uploadAttachment(AttachmentDto dto) {
        if (dto.getFileName() == null || dto.getFileName().trim().isEmpty()) {
            throw new IllegalArgumentException("File name cannot be empty");
        }

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        User uploader = dto.getUploadedById() != null
                ? userRepository.findById(dto.getUploadedById()).orElse(null)
                : null;

        Attachment attachment = new Attachment();
        attachment.setProject(project);
        attachment.setUploadedBy(uploader);
        attachment.setFileName(dto.getFileName());
        attachment.setFilePath(dto.getFilePath());
        attachment.setFileData(dto.getFileData());

        Attachment saved = attachmentRepository.save(attachment);
        return toDto(saved);
    }

    @Override
    public List<AttachmentDto> getAttachmentsByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        return attachmentRepository.findByProject(project).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public AttachmentDto getAttachmentById(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        return toDto(attachment);
    }

    private AttachmentDto toDto(Attachment attachment) {
        AttachmentDto dto = new AttachmentDto();
        dto.setAttachmentId(attachment.getAttachmentId());
        dto.setProjectId(attachment.getProject().getProjectId());
        dto.setUploadedById(attachment.getUploadedBy() != null ? attachment.getUploadedBy().getUserId() : null);
        dto.setFileName(attachment.getFileName());
        dto.setFilePath(attachment.getFilePath());
        dto.setFileData(attachment.getFileData());
        dto.setUploadedAt(attachment.getUploadedAt());
        return dto;
    }
}

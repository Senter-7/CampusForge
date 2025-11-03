package com.campusconnect.controller;

import com.campusconnect.dto.AttachmentDto;
import com.campusconnect.service.AttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    // ✅ Upload new attachment
    @PostMapping
    public ResponseEntity<AttachmentDto> uploadAttachment(@RequestBody AttachmentDto attachmentDto) {
        return ResponseEntity.ok(attachmentService.uploadAttachment(attachmentDto));
    }

    // ✅ Get all attachments for a project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<AttachmentDto>> getAttachmentsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByProject(projectId));
    }

    // ✅ Get a single attachment (to download/view)
    @GetMapping("/{attachmentId}")
    public ResponseEntity<AttachmentDto> getAttachmentById(@PathVariable Long attachmentId) {
        return ResponseEntity.ok(attachmentService.getAttachmentById(attachmentId));
    }
}

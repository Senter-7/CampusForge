package com.campusconnect.controller;

import com.campusconnect.dto.MessageDto;
import com.campusconnect.dto.MessageRequest;
import com.campusconnect.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * Send a message in a specific project workspace.
     * Accessible only to project members (leader, mentor, member).
     */
    @PostMapping("/{projectId}")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #projectId)")
    public MessageDto sendMessage(
            @PathVariable Long projectId,
            @RequestBody MessageRequest request
    ) {
        return messageService.sendMessage(projectId, request.getContent());
    }

    /**
     * Fetch all messages for a given project.
     * Accessible only to project members.
     */
    @GetMapping("/{projectId}")
    @PreAuthorize("@projectSecurity.isProjectMember(authentication, #projectId)")
    public List<MessageDto> getMessagesByProject(@PathVariable Long projectId) {
        return messageService.getMessagesByProject(projectId);
    }
}

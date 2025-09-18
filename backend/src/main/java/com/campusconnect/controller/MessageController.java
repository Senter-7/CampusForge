package com.campusconnect.controller;

import com.campusconnect.dto.MessageDto;
import com.campusconnect.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @GetMapping("/project/{projectId}")
    public List<MessageDto> getMessagesForProject(@PathVariable Long projectId) {
        return messageService.getMessagesForProject(projectId);
    }

    @PostMapping
    public ResponseEntity<MessageDto> sendMessage(@RequestBody MessageDto messageDto) {
        return ResponseEntity.ok(messageService.sendMessage(messageDto));
    }
}

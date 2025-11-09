package com.campusconnect.controller;

import com.campusconnect.dto.MessageDto;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketMessageController {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketMessageController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Handle incoming messages and broadcast to project-specific topic
     * Client sends to: /app/message
     * Server broadcasts to: /topic/project/{projectId}
     */
    @MessageMapping("/message")
    public void handleMessage(@Payload MessageDto message) {
        // Broadcast message to all subscribers of this project's topic
        String destination = "/topic/project/" + message.getProjectId();
        messagingTemplate.convertAndSend(destination, message);
    }

    /**
     * Alternative: Direct send method that can be called from REST controller
     * This allows us to broadcast messages when they're saved via REST API
     */
    public void broadcastMessage(MessageDto message) {
        String destination = "/topic/project/" + message.getProjectId();
        messagingTemplate.convertAndSend(destination, message);
    }
}


package com.campusconnect.service;

import com.campusconnect.controller.WebSocketMessageController;
import com.campusconnect.dto.MessageDto;
import com.campusconnect.entity.Message;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import com.campusconnect.mapper.MessageMapper;
import com.campusconnect.repository.MessageRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MessageMapper messageMapper;
    private final WebSocketMessageController webSocketController;


    @Override
    public MessageDto sendMessage(Long projectId, String content) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String email = auth.getName();

        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Message msg = Message.builder()
                .project(project)
                .sender(sender)
                .content(content)
                .build();

        messageRepository.save(msg);
        MessageDto messageDto = messageMapper.toDto(msg);
        
        // Broadcast message via WebSocket to all subscribers of this project
        webSocketController.broadcastMessage(messageDto);
        
        return messageDto;

    }

    @Override
    public List<MessageDto> getMessagesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        return messageRepository.findByProjectOrderByCreatedAtAsc(project)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteMessage(Long messageId, Long requesterId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        Long senderId = msg.getSender().getUserId();
        Long leaderId = msg.getProject().getCreator().getUserId();

        // Only sender or project leader can delete
        if (!senderId.equals(requesterId) && !leaderId.equals(requesterId)) {
            throw new RuntimeException("Not authorized to delete this message");
        }

        messageRepository.delete(msg);
    }

    @Override
    public List<MessageDto> getRecentMessagesForUser(Long userId) {
        return messageRepository.findRecentMessagesByUser(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private MessageDto toDto(Message msg) {
        return MessageDto.builder()
                .messageId(msg.getMessageId())
                .projectId(msg.getProject().getProjectId())
                .senderId(msg.getSender() != null ? msg.getSender().getUserId() : null)
                .senderName(msg.getSender() != null ? msg.getSender().getName() : "Unknown")
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt().toString())
                .build();
    }
}

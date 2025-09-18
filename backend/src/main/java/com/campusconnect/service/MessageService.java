
package com.campusconnect.service;

import com.campusconnect.dto.MessageDto;
import com.campusconnect.entity.Message;
import com.campusconnect.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public List<MessageDto> getMessagesForProject(Long projectId) {
        return messageRepository.findByProjectId(projectId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public MessageDto sendMessage(MessageDto messageDto) {
        Message message = new Message();
        message.setProjectId(messageDto.getProjectId());
        message.setUserId(messageDto.getUserId());
        message.setContent(messageDto.getContent());
        message.setTimestamp(LocalDateTime.now());
        messageRepository.save(message);
        return toDto(message);
    }

    private MessageDto toDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setProjectId(message.getProjectId());
        dto.setUserId(message.getUserId());
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        return dto;
    }
}

/*
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
*/

/*
Changes made:
 Change 1: Added dependency injection for ProjectRepository and UserRepository
 Change 2: Added validateProjectId(Long projectId) method to check if project exists
 Change 3: Added validateUserId(Long userId) method to check if user exists
 Change 4: Added validateMessageDto(MessageDto messageDto) method to validate message content
 Change 5: Added validation calls in getMessagesForProject() to ensure project exists
 Change 6: Added validation calls in sendMessage() to validate message, project, and user before saving
 Change 7: Modified timestamp handling in sendMessage() to use messageDto.getTimestamp() if provided, otherwise LocalDateTime.now()
 Change 8: Changed messageRepository.save(message) to return savedMessage and then convert it using toDto(savedMessage)
 Change 9: Added IllegalArgumentException with clear messages for invalid input (empty content, missing project, missing user)
*/
// Refactored code below

package com.campusconnect.service;

import com.campusconnect.dto.MessageDto;
import com.campusconnect.entity.Message;
import com.campusconnect.repository.MessageRepository;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public List<MessageDto> getMessagesForProject(Long projectId) {
        validateProjectId(projectId);
        return messageRepository.findByProjectId(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public MessageDto sendMessage(MessageDto messageDto) {
        validateMessageDto(messageDto);
        validateProjectId(messageDto.getProjectId());
        validateUserId(messageDto.getUserId());

        Message message = new Message();
        message.setProjectId(messageDto.getProjectId());
        message.setUserId(messageDto.getUserId());
        message.setContent(messageDto.getContent());
        message.setTimestamp(messageDto.getTimestamp() != null ? messageDto.getTimestamp() : LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);
        return toDto(savedMessage);
    }

    private void validateMessageDto(MessageDto messageDto) {
        if (messageDto == null || messageDto.getContent() == null || messageDto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be null or empty");
        }
    }

    private void validateProjectId(Long projectId) {
        if (projectId == null || !projectRepository.findById(projectId).isPresent()) {
            throw new IllegalArgumentException("Project not found");
        }
    }

    private void validateUserId(Long userId) {
        if (userId == null || !userRepository.findById(userId).isPresent()) {
            throw new IllegalArgumentException("User not found");
        }
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

package com.campusconnect.mapper;

import com.campusconnect.dto.MessageDto;
import com.campusconnect.dto.MessageSummaryDto;
import com.campusconnect.entity.Message;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    public MessageDto toDto(Message message) {
        if (message == null) return null;

        return MessageDto.builder()
                .messageId(message.getMessageId())
                .projectId(message.getProject() != null ? message.getProject().getProjectId() : null)
                .senderId(message.getSender() != null ? message.getSender().getUserId() : null)
                .senderName(message.getSender() != null ? message.getSender().getName() : "Unknown")
                .content(message.getContent())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }

    public MessageSummaryDto toMessageSummaryDto(Message message) {
        if (message == null) return null;

        return MessageSummaryDto.builder()
                .messageId(message.getMessageId())
                .projectId(message.getProject() != null ? message.getProject().getProjectId() : null)
                .projectTitle(message.getProject() != null ? message.getProject().getTitle() : "Untitled")
                .lastMessage(message.getContent())
                .senderName(message.getSender() != null ? message.getSender().getName() : "Unknown")
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }
}

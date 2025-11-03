package com.campusconnect.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageSummaryDto {
    private Long messageId;
    private Long projectId;
    private String projectTitle;
    private String lastMessage;
    private String senderName;
    private String createdAt;
}

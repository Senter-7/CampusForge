package com.campusconnect.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageDto {
    private Long messageId;
    private Long projectId;
    private Long senderId;
    private String senderName;
    private String content;
    private String createdAt;
}

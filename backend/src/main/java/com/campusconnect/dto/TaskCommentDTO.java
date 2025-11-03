package com.campusconnect.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCommentDTO {
    private Long commentId;
    private Long taskId;
    private String username;
    private String content;
    private LocalDateTime createdAt;
}

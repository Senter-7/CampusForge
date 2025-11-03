package com.campusconnect.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponseDTO {
    private Long taskId;
    private Long projectId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private Long createdById;
    private Long assignedToId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

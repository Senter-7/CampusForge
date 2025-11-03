package com.campusconnect.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRequestDTO {
    private Long projectId;
    private String title;
    private String description;
    private String priority;   // "low", "medium", "high"
    private String status;     // optional during update
    private LocalDate dueDate;
    private Long assignedToId;   // user_id
}

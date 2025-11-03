package com.campusconnect.dto;

import java.util.List;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DashboardDto {
    private List<ProjectDto> projects;
    private List<TaskDto> assignedTasks;
    private List<CollaborationRequestDto> pendingRequests;
    private List<MessageSummaryDto> recentMessages;
}

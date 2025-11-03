package com.campusconnect.service;

import com.campusconnect.dto.MessageDto;
import java.util.List;

public interface MessageService {

    /**
     * Send a new message in a project chat.
     */
    MessageDto sendMessage(Long projectId, String content);

    /**
     * Fetch all messages for a specific project.
     */
    List<MessageDto> getMessagesByProject(Long projectId);

    /**
     * Delete a message (only sender or project leader/mentor can delete).
     */
    void deleteMessage(Long messageId, Long requesterId);

    /**
     * Fetch recent messages for a user across all projects (for dashboard previews).
     */
    List<MessageDto> getRecentMessagesForUser(Long userId);
}

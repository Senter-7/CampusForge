package com.campusconnect.service;

import com.campusconnect.dto.ProjectMemberDto;
import java.util.List;

public interface ProjectMemberService {
    List<ProjectMemberDto> getMembersByProject(Long projectId);
    ProjectMemberDto addMember(Long projectId, Long userId, Long requesterId, String role);
    void removeMember(Long projectId, Long memberId, Long requesterId);
}

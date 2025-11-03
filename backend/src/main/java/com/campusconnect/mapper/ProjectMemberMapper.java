package com.campusconnect.mapper;

import com.campusconnect.dto.ProjectMemberDto;
import com.campusconnect.entity.ProjectMember;

public class ProjectMemberMapper {

    public static ProjectMemberDto toDto(ProjectMember member) {
        if (member == null) return null;

        ProjectMemberDto dto = new ProjectMemberDto();
        dto.setMemberId(member.getMemberId());

        if (member.getProject() != null) {
            dto.setProjectId(member.getProject().getProjectId());
            dto.setProjectTitle(member.getProject().getTitle());
        }

        if (member.getUser() != null) {
            dto.setUserId(member.getUser().getUserId());
            dto.setUserName(member.getUser().getName());
        }

        dto.setRole(member.getRole().name());
        dto.setJoinedAt(member.getJoinedAt());
        return dto;
    }
}

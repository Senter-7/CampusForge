package com.campusconnect.dto;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.Set;

import com.campusconnect.entity.Project;

public class ProjectDto {
    private Long projectId;
    private String title;
    private String description;
    private Long creatorId;
    private String status;
    private Timestamp createdAt;
    private Integer membersRequired;
    private Date deadline;
    private Set<SkillDto> skills;
    private Set<Long> memberIds;

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public Set<SkillDto> getSkills() { return skills; }
    public void setSkills(Set<SkillDto> skills) { this.skills = skills; }
    public Set<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(Set<Long> memberIds) { this.memberIds = memberIds; }
    public Integer getMembersRequired() { return membersRequired; }
    public void setMembersRequired(Integer membersRequired) { this.membersRequired = membersRequired; }
    public Date getDeadline() { return deadline; }
    public void setDeadline(Date deadline) { this.deadline = deadline; }
}

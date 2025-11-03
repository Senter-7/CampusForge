package com.campusconnect.dto;

public class SkillDto {
    private Long skillId;
    private String name;

    public SkillDto() {} // no-args for frameworks

    public SkillDto(Long skillId, String name) {
        this.skillId = skillId;
        this.name = name;
    }
    // Getters and Setters
    public Long getSkillId() { return skillId; }
    public void setSkillId(Long skillId) { this.skillId = skillId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
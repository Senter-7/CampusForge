package com.campusconnect.dto;

import java.sql.Timestamp;
import java.util.Set;
import java.util.stream.Collectors;

import com.campusconnect.entity.User;

public class UserDto {
    private Long userId;
    private String name;
    private String email;
    private String bio;
    private byte[] profileImage;
    private String role;
    private Timestamp createdAt;
    private Set<SkillDto> skills;
    private Set<InterestDto> interests;
    private Long universityId;
    private String universityName;

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public byte[] getProfileImage() { return profileImage; }
    public void setProfileImage(byte[] profileImage) { this.profileImage = profileImage; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public Set<SkillDto> getSkills() { return skills; }
    public void setSkills(Set<SkillDto> skills) { this.skills = skills; }
    public Set<InterestDto> getInterests() { return interests; }
    public void setInterests(Set<InterestDto> interests) { this.interests = interests; }
    public Long getUniversityId() { return universityId; }
    public void setUniversityId(Long universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }

    public UserDto() {}

    public UserDto(User user) {
        this.userId = user.getUserId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.bio = user.getBio();
        this.profileImage = user.getProfileImage();
        this.role = user.getRole().name();
        this.createdAt = user.getCreatedAt();

        if (user.getUniversity() != null) {
            this.universityId = user.getUniversity().getUniversityId();
            this.universityName = user.getUniversity().getName();
        }

        if (user.getSkills() != null) {
            this.skills = user.getSkills().stream()
                .map(skill -> new SkillDto(skill.getSkillId(), skill.getName()))
                .collect(Collectors.toSet());
        }
        if (user.getInterests() != null) {
            this.interests = user.getInterests().stream()
                .map(interest -> new InterestDto(interest.getInterestId(), interest.getName()))
                .collect(Collectors.toSet());
        }
    }
}

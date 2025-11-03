package com.campusconnect.mapper;

import com.campusconnect.dto.*;
import com.campusconnect.entity.*;
import java.util.Set;
import java.util.stream.Collectors;

public class UserMapper {

    public static UserDto toDto(User user) {
        if (user == null) return null;

        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setBio(user.getBio());
        dto.setProfileImage(user.getProfileImage());
        dto.setRole(user.getRole().name());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getSkills() != null) {
            dto.setSkills(
                user.getSkills().stream()
                    .map(s -> new SkillDto(s.getSkillId(), s.getName()))
                    .collect(Collectors.toSet())
            );
        }

        if (user.getInterests() != null) {
            dto.setInterests(
                user.getInterests().stream()
                    .map(i -> new InterestDto(i.getInterestId(), i.getName()))
                    .collect(Collectors.toSet())
            );
        }

        return dto;
    }

    public static User toEntity(UserDto dto) {
        if (dto == null) return null;

        User user = new User();
        user.setUserId(dto.getUserId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setBio(dto.getBio());
        user.setProfileImage(dto.getProfileImage());

        if (dto.getSkills() != null) {
            Set<Skill> skills = dto.getSkills().stream()
                .map(s -> {
                    Skill skill = new Skill();
                    skill.setSkillId(s.getSkillId());
                    skill.setName(s.getName());
                    return skill;
                })
                .collect(Collectors.toSet());
            user.setSkills(skills);
        }

        if (dto.getInterests() != null) {
            Set<Interest> interests = dto.getInterests().stream()
                .map(i -> {
                    Interest interest = new Interest();
                    interest.setInterestId(i.getInterestId());
                    interest.setName(i.getName());
                    return interest;
                })
                .collect(Collectors.toSet());
            user.setInterests(interests);
        }

        return user;
    }

    public static void updateUserFromDto(User user, UserDto dto) {
        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getProfileImage() != null) user.setProfileImage(dto.getProfileImage());

        if (dto.getSkills() != null) {
            user.setSkills(dto.getSkills().stream()
                .map(s -> {
                    Skill skill = new Skill();
                    skill.setSkillId(s.getSkillId());
                    skill.setName(s.getName());
                    return skill;
                })
                .collect(Collectors.toSet()));
        }

        if (dto.getInterests() != null) {
            user.setInterests(dto.getInterests().stream()
                .map(i -> {
                    Interest interest = new Interest();
                    interest.setInterestId(i.getInterestId());
                    interest.setName(i.getName());
                    return interest;
                })
                .collect(Collectors.toSet()));
        }
    }
}

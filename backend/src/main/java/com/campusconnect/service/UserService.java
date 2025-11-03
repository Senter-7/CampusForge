package com.campusconnect.service;

import com.campusconnect.dto.UserDto;
import com.campusconnect.dto.SkillDto;
import com.campusconnect.dto.InterestDto;
import com.campusconnect.entity.User;
import com.campusconnect.entity.Skill;
import com.campusconnect.entity.Interest;
import com.campusconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ✅ Get all users
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Get user by ID (accepts Long)
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id) // convert if repository uses Long
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ✅ Search users by name or skill (basic example)
    public List<UserDto> searchUsers(String name, String skill) {
        List<User> users = userRepository.findAll(); // later replace with custom query

        return users.stream()
                .filter(u ->
                        (name == null || u.getName().toLowerCase().contains(name.toLowerCase())) &&
                        (skill == null || u.getSkills().stream()
                                .anyMatch(s -> s.getName().toLowerCase().contains(skill.toLowerCase())))
                )
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Update user (accepts Long)
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(userDto.getName());
        user.setBio(userDto.getBio());
        user.setProfileImage(userDto.getProfileImage());
        user.setRole(User.Role.valueOf(userDto.getRole()));

        userRepository.save(user);
        return toDto(user);
    }

    // ✅ Convert entity → DTO
    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setBio(user.getBio());
        dto.setProfileImage(user.getProfileImage());
        dto.setRole(user.getRole().name());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getSkills() != null) {
            dto.setSkills(user.getSkills().stream()
                    .map(skill -> {
                        SkillDto sd = new SkillDto();
                        sd.setSkillId(skill.getSkillId());
                        sd.setName(skill.getName());
                        return sd;
                    }).collect(Collectors.toSet()));
        }

        if (user.getInterests() != null) {
            dto.setInterests(user.getInterests().stream()
                    .map(interest -> {
                        InterestDto idto = new InterestDto();
                        idto.setInterestId(interest.getInterestId());
                        idto.setName(interest.getName());
                        return idto;
                    }).collect(Collectors.toSet()));
        }

        return dto;
    }
}

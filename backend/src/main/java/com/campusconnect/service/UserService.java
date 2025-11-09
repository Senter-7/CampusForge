package com.campusconnect.service;

import com.campusconnect.dto.UserDto;
import com.campusconnect.dto.SkillDto;
import com.campusconnect.dto.InterestDto;
import com.campusconnect.entity.User;
import com.campusconnect.entity.Skill;
import com.campusconnect.entity.Interest;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.repository.ProjectMemberRepository;
import com.campusconnect.repository.UniversityRepository;
import com.campusconnect.repository.SkillRepository;
import com.campusconnect.repository.InterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private InterestRepository interestRepository;

    // ✅ Get all teammates (students only, with profile info)
    @Transactional(readOnly = true)
    public List<UserDto> getTeammates(String searchQuery, String major, String year, String availability) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT) // Only students
                .filter(u -> {
                    // Search filter
                    if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                        String query = searchQuery.toLowerCase();
                        boolean matchesName = u.getName() != null && u.getName().toLowerCase().contains(query);
                        boolean matchesMajor = u.getMajor() != null && u.getMajor().toLowerCase().contains(query);
                        boolean matchesSkills = u.getSkills() != null && u.getSkills().stream()
                                .anyMatch(s -> s.getName().toLowerCase().contains(query));
                        boolean matchesInterests = u.getInterests() != null && u.getInterests().stream()
                                .anyMatch(i -> i.getName().toLowerCase().contains(query));
                        if (!matchesName && !matchesMajor && !matchesSkills && !matchesInterests) {
                            return false;
                        }
                    }
                    // Major filter
                    if (major != null && !major.trim().isEmpty() && !major.equals("all")) {
                        if (u.getMajor() == null || !u.getMajor().toLowerCase().contains(major.toLowerCase())) {
                            return false;
                        }
                    }
                    // Year filter
                    if (year != null && !year.trim().isEmpty() && !year.equals("all")) {
                        if (u.getYear() == null || !u.getYear().name().equalsIgnoreCase(year)) {
                            return false;
                        }
                    }
                    // Availability filter
                    if (availability != null && !availability.trim().isEmpty() && !availability.equals("all")) {
                        if (u.getAvailability() == null || !u.getAvailability().name().equalsIgnoreCase(availability)) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        return users.stream()
                .map(this::toTeammateDto)
                .collect(Collectors.toList());
    }

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
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update basic fields
        if (userDto.getName() != null) {
            user.setName(userDto.getName());
        }
        if (userDto.getEmail() != null) {
            user.setEmail(userDto.getEmail());
        }
        if (userDto.getBio() != null) {
            user.setBio(userDto.getBio());
        }
        if (userDto.getProfileImage() != null) {
            user.setProfileImage(userDto.getProfileImage());
        }

        // Update university
        if (userDto.getUniversityId() != null) {
            universityRepository.findById(userDto.getUniversityId())
                    .ifPresent(user::setUniversity);
        }

        // Update teammate profile fields
        if (userDto.getMajor() != null) {
            user.setMajor(userDto.getMajor());
        }
        if (userDto.getYear() != null && !userDto.getYear().trim().isEmpty()) {
            try {
                user.setYear(User.Year.valueOf(userDto.getYear()));
            } catch (IllegalArgumentException e) {
                // Invalid year value, skip
            }
        }
        if (userDto.getAvailability() != null && !userDto.getAvailability().trim().isEmpty()) {
            try {
                user.setAvailability(User.Availability.valueOf(userDto.getAvailability()));
            } catch (IllegalArgumentException e) {
                // Invalid availability value, skip
            }
        }
        if (userDto.getHoursPerWeek() != null) {
            user.setHoursPerWeek(userDto.getHoursPerWeek());
        }

        // Update skills
        if (userDto.getSkills() != null) {
            Set<Skill> skills = new HashSet<>();
            for (SkillDto skillDto : userDto.getSkills()) {
                if (skillDto.getName() != null && !skillDto.getName().trim().isEmpty()) {
                    final String skillName = skillDto.getName().trim();
                    Skill skill = skillRepository.findByName(skillName)
                            .orElseGet(() -> {
                                Skill newSkill = new Skill();
                                newSkill.setName(skillName);
                                return skillRepository.save(newSkill);
                            });
                    skills.add(skill);
                }
            }
            user.setSkills(skills);
        }

        // Update interests
        if (userDto.getInterests() != null) {
            Set<Interest> interests = new HashSet<>();
            for (InterestDto interestDto : userDto.getInterests()) {
                if (interestDto.getName() != null && !interestDto.getName().trim().isEmpty()) {
                    final String interestName = interestDto.getName().trim();
                    Interest interest = interestRepository.findByName(interestName)
                            .orElseGet(() -> {
                                Interest newInterest = new Interest();
                                newInterest.setName(interestName);
                                return interestRepository.save(newInterest);
                            });
                    interests.add(interest);
                }
            }
            user.setInterests(interests);
        }

        userRepository.save(user);
        return toDto(user);
    }

    // ✅ Delete user (users can delete their own account)
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    // ✅ Convert entity → DTO (for teammates with computed fields)
    private UserDto toTeammateDto(User user) {
        UserDto dto = new UserDto(user);
        
        // Compute project count
        long projectCount = projectMemberRepository.countByUser_UserId(user.getUserId());
        dto.setProjectCount((int) projectCount);
        
        // For now, set a default rating (can be enhanced with user_ratings table later)
        dto.setRating(4.5); // Placeholder
        
        // Update last_seen to determine online status (if within last 5 minutes, consider online)
        if (user.getLastSeen() != null) {
            long minutesSinceLastSeen = (System.currentTimeMillis() - user.getLastSeen().getTime()) / (1000 * 60);
            // We'll handle online status in the frontend based on lastSeen
        }
        
        return dto;
    }

    // ✅ Convert entity → DTO
    private UserDto toDto(User user) {
        UserDto dto = new UserDto(user);
        
        // For regular user DTOs, we can also include project count if needed
        long projectCount = projectMemberRepository.countByUser_UserId(user.getUserId());
        dto.setProjectCount((int) projectCount);
        
        return dto;
    }

    // ✅ Update last seen timestamp (call this when user is active)
    public void updateLastSeen(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setLastSeen(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);
    }
}

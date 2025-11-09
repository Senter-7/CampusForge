package com.campusconnect.service;

import com.campusconnect.dto.*;
import com.campusconnect.entity.User;
import com.campusconnect.entity.Skill;
import com.campusconnect.entity.Interest;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.repository.UniversityRepository;
import com.campusconnect.repository.SkillRepository;
import com.campusconnect.repository.InterestRepository;
import com.campusconnect.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.HashSet;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private InterestRepository interestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponseDto register(RegisterDto registerDto) {
        // ✅ Check if user already exists
        if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // ✅ Create new user
        User user = new User();
        user.setName(registerDto.getName());
        user.setEmail(registerDto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerDto.getPassword()));

        // Default role = STUDENT if none specified
        if (registerDto.getRole() == null || registerDto.getRole().isEmpty()) {
            user.setRole(User.Role.STUDENT);
        } else {
            user.setRole(User.Role.valueOf(registerDto.getRole().toUpperCase()));
        }

        // Set university if provided
        Long universityId = registerDto.getUniversityId();
        if (universityId != null) {
            universityRepository.findById(universityId)
                    .ifPresent(user::setUniversity);
        }

        // Process and set skills
        Set<Skill> skills = new HashSet<>();
        if (registerDto.getSkills() != null && !registerDto.getSkills().trim().isEmpty()) {
            String[] skillNames = registerDto.getSkills().split(",");
            for (String skillNameRaw : skillNames) {
                final String skillName = skillNameRaw.trim();
                if (!skillName.isEmpty()) {
                    Skill skill = skillRepository.findByName(skillName)
                            .orElseGet(() -> {
                                Skill newSkill = new Skill();
                                newSkill.setName(skillName);
                                return skillRepository.save(newSkill);
                            });
                    skills.add(skill);
                }
            }
        }
        user.setSkills(skills);

        // Process and set interests
        Set<Interest> interests = new HashSet<>();
        if (registerDto.getInterests() != null && !registerDto.getInterests().trim().isEmpty()) {
            String[] interestNames = registerDto.getInterests().split(",");
            for (String interestNameRaw : interestNames) {
                final String interestName = interestNameRaw.trim();
                if (!interestName.isEmpty()) {
                    Interest interest = interestRepository.findByName(interestName)
                            .orElseGet(() -> {
                                Interest newInterest = new Interest();
                                newInterest.setName(interestName);
                                return interestRepository.save(newInterest);
                            });
                    interests.add(interest);
                }
            }
        }
        user.setInterests(interests);

        userRepository.save(user);

        // ✅ Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponseDto(token, user.getRole().name(), "User registered successfully", user.getUserId());
    }

    public AuthResponseDto login(LoginDto loginDto) {
        // ✅ Authenticate user using Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword())
        );

        // ✅ Fetch user from DB
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // ✅ Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponseDto(token, user.getRole().name(), "Login successful", user.getUserId());
    }
}

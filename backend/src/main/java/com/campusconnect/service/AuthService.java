package com.campusconnect.service;

import com.campusconnect.dto.*;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

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

        userRepository.save(user);

        // ✅ Generate JWT
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponseDto(token, user.getRole().name(), "User registered successfully");
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

        return new AuthResponseDto(token, user.getRole().name(), "Login successful");
    }
}

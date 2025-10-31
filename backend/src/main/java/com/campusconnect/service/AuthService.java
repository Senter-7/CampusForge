package com.campusconnect.service;

import com.campusconnect.dto.LoginDto;
import com.campusconnect.dto.RegisterDto;
import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String register(RegisterDto registerDto) {
        if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        User user = new User();
        user.setUsername(registerDto.getUsername());
        user.setEmail(registerDto.getEmail());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setSkills(registerDto.getSkills());
        user.setInterests(registerDto.getInterests());
        userRepository.save(user);
        return jwtUtil.generateToken(user.getEmail());
    }

    public String login(LoginDto loginDto) {
        User user = userRepository.findByEmail(loginDto.getEmail()).orElseThrow();
        if (passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            return jwtUtil.generateToken(user.getEmail());
        }
        throw new RuntimeException("Invalid credentials");
    }
}

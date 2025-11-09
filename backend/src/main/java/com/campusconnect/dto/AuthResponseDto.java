package com.campusconnect.dto;

public class AuthResponseDto {
    private String token;
    private String role;
    private String message;
    private Long userId;

    // Constructors
    public AuthResponseDto() {}
    public AuthResponseDto(String token, String role, String message) {
        this.token = token;
        this.role = role;
        this.message = message;
    }
    public AuthResponseDto(String token, String role, String message, Long userId) {
        this.token = token;
        this.role = role;
        this.message = message;
        this.userId = userId;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}

package com.campusconnect.dto;

public class AuthResponseDto {
    private String token;
    private String role;
    private String message;

    // Constructors
    public AuthResponseDto() {}
    public AuthResponseDto(String token, String role, String message) {
        this.token = token;
        this.role = role;
        this.message = message;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

package com.campusconnect.service;

import com.campusconnect.dto.UserDto;
import java.util.List;
import java.util.Map;

public interface AdminService {

    List<UserDto> getAllUsers();

    void deleteUser(Long id);

    UserDto updateUserRole(Long id, String role);

    Map<String, Object> getDashboardStats();

    UserDto getUserById(Long id);
    
    void deleteProject(Long projectId);
}

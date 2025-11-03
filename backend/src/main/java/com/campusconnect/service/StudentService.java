package com.campusconnect.service;

import com.campusconnect.dto.UserDto;
import java.util.List;
import java.util.Map;

public interface StudentService {

    UserDto getProfile(Long id);

    UserDto updateProfile(Long id, UserDto userDto);

    List<Map<String, Object>> getStudentProjects(Long studentId);

    void joinProject(Long studentId, Long projectId);
}

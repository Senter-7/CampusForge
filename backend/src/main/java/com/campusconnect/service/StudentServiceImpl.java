package com.campusconnect.service;

import com.campusconnect.dto.UserDto;
import com.campusconnect.entity.Project;
import com.campusconnect.entity.User;
import com.campusconnect.mapper.UserMapper;
import com.campusconnect.repository.ProjectRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

   @Override
    public UserDto getProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return UserMapper.toDto(user);
    }


   @Override
    public UserDto updateProfile(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        UserMapper.updateUserFromDto(user, userDto);
        userRepository.save(user);

        return UserMapper.toDto(user);
    }


    @Override
    public List<Map<String, Object>> getStudentProjects(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Project> projects = projectRepository.findByMembersContaining(user);

        return projects.stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getProjectId());
                    map.put("title", p.getTitle());
                    map.put("status", p.getStatus().name());
                    return map;
                })
                .collect(Collectors.toList());
    }



    @Override
    public void joinProject(Long studentId, Long projectId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.getMembers().add(student);
        projectRepository.save(project);
    }
}

package com.campusconnect.dto;

public class CourseDto {
    private Long courseId;
    private String name;
    private Long professorId;
    private String professorName;
    private Long universityId;
    private String universityName;
    private String description;


    // Getters and Setters
    public String getProfessorName() { return professorName; }
    public void setProfessorName(String professorName) { this.professorName = professorName; }

    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }

    public Long getUniversityId() { return universityId; }
    public void setUniversityId(Long universityId) { this.universityId = universityId; }
    
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getProfessorId() { return professorId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseId;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "professor_id", referencedColumnName = "professor_id")
    private Professor professor;
    
    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;
    
    private String description;

    public Course(){};

    public Course(Long courseId) {
        this.courseId = courseId;
    }

    // Getters and Setters
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Professor getProfessor() { return professor; }
    public void setProfessor(Professor professor) { this.professor = professor; }

    public University getUniversity() { return university; }
    public void setUniversity(University university) { this.university = university; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

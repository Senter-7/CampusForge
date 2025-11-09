package com.campusconnect.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "professors")
public class Professor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "professor_id") 
    private Long professorId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String department;

    @Column(length = 100, unique = true)
    private String email;
    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    public Professor(){};
        
    public Professor(Long professorId) {
        this.professorId = professorId;
    }

    // Getters and Setters
    public Long getProfessorId() { return professorId; }
    public void setProfessorId(Long professorId) { this.professorId = professorId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public University getUniversity() { return university; }
    public void setUniversity(University university) { this.university = university; }

}

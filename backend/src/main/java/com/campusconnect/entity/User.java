package com.campusconnect.entity;

import jakarta.persistence.*;
import java.sql.Timestamp;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Lob
    private String bio;

    @Lob
    private byte[] profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) CHECK (role IN ('STUDENT', 'PROFESSOR', 'ADMIN'))")
    private Role role = Role.STUDENT;

    @Column(nullable = false)
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());

    @ManyToMany
    @JoinTable(
        name = "user_skills",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills;

    @ManyToMany
    @JoinTable(
        name = "user_interests",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "interest_id")
    )
    private Set<Interest> interests;

    public enum Role {
        STUDENT, PROFESSOR, ADMIN
    }
    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    // Teammate profile fields
    @Column(length = 100)
    private String major;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate')")
    private Year year;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('Available', 'Limited', 'Busy')")
    private Availability availability = Availability.Available;

    @Column(name = "hours_per_week", length = 20)
    private String hoursPerWeek;

    @Column(name = "last_seen")
    private Timestamp lastSeen;

    public enum Year {
        Freshman, Sophomore, Junior, Senior, Graduate
    }

    public enum Availability {
        Available, Limited, Busy
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public byte[] getProfileImage() { return profileImage; }
    public void setProfileImage(byte[] profileImage) { this.profileImage = profileImage; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    public Set<Skill> getSkills() { return skills; }
    public void setSkills(Set<Skill> skills) { this.skills = skills; }
    public Set<Interest> getInterests() { return interests; }
    public void setInterests(Set<Interest> interests) { this.interests = interests; }
    public University getUniversity() { return university; }
    public void setUniversity(University university) { this.university = university; }

    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }

    public Year getYear() { return year; }
    public void setYear(Year year) { this.year = year; }

    public Availability getAvailability() { return availability; }
    public void setAvailability(Availability availability) { this.availability = availability; }

    public String getHoursPerWeek() { return hoursPerWeek; }
    public void setHoursPerWeek(String hoursPerWeek) { this.hoursPerWeek = hoursPerWeek; }

    public Timestamp getLastSeen() { return lastSeen; }
    public void setLastSeen(Timestamp lastSeen) { this.lastSeen = lastSeen; }
    
}
package com.campusconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "course_details")
public class CourseDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Long courseId;

    @ManyToOne
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private Professor professor;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "credits")
    private Byte credits;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Overall stats
    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(name = "reviews")
    private Integer reviews = 0;

    @Column(precision = 3, scale = 1)
    private BigDecimal difficulty;

    @Column(length = 50)
    private String workload;

    @Column(name = "enrolled")
    private Integer enrolled = 0;

    // Flattened rating categories
    @Column(name = "rating_content", precision = 3, scale = 1)
    private BigDecimal ratingContent;

    @Column(name = "rating_teaching", precision = 3, scale = 1)
    private BigDecimal ratingTeaching;

    @Column(name = "rating_assignments", precision = 3, scale = 1)
    private BigDecimal ratingAssignments;

    @Column(name = "rating_exams", precision = 3, scale = 1)
    private BigDecimal ratingExams;

    // JSON fields
    @Column(columnDefinition = "JSON")
    @Convert(converter = StringListConverter.class)
    private List<String> tags;

    @Column(columnDefinition = "JSON")
    @Convert(converter = StringListConverter.class)
    private List<String> prerequisites;

    public CourseDetail() {}

    // Getters and Setters
    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public University getUniversity() {
        return university;
    }

    public void setUniversity(University university) {
        this.university = university;
    }

    public Professor getProfessor() {
        return professor;
    }

    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Byte getCredits() {
        return credits;
    }

    public void setCredits(Byte credits) {
        this.credits = credits;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public Integer getReviews() {
        return reviews;
    }

    public void setReviews(Integer reviews) {
        this.reviews = reviews;
    }

    public BigDecimal getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(BigDecimal difficulty) {
        this.difficulty = difficulty;
    }

    public String getWorkload() {
        return workload;
    }

    public void setWorkload(String workload) {
        this.workload = workload;
    }

    public Integer getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(Integer enrolled) {
        this.enrolled = enrolled;
    }

    public BigDecimal getRatingContent() {
        return ratingContent;
    }

    public void setRatingContent(BigDecimal ratingContent) {
        this.ratingContent = ratingContent;
    }

    public BigDecimal getRatingTeaching() {
        return ratingTeaching;
    }

    public void setRatingTeaching(BigDecimal ratingTeaching) {
        this.ratingTeaching = ratingTeaching;
    }

    public BigDecimal getRatingAssignments() {
        return ratingAssignments;
    }

    public void setRatingAssignments(BigDecimal ratingAssignments) {
        this.ratingAssignments = ratingAssignments;
    }

    public BigDecimal getRatingExams() {
        return ratingExams;
    }

    public void setRatingExams(BigDecimal ratingExams) {
        this.ratingExams = ratingExams;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<String> getPrerequisites() {
        return prerequisites;
    }

    public void setPrerequisites(List<String> prerequisites) {
        this.prerequisites = prerequisites;
    }
}


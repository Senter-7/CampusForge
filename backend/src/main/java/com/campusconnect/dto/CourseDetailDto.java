package com.campusconnect.dto;

import java.math.BigDecimal;
import java.util.List;

public class CourseDetailDto {
    private Long courseId;
    private Long universityId;
    private String universityName;
    private Long professorId;
    private String professorName;
    private String code;
    private String name;
    private Byte credits;
    private String description;
    
    // Overall stats
    private BigDecimal rating;
    private Integer reviews;
    private BigDecimal difficulty;
    private String workload;
    private Integer enrolled;
    
    // Flattened rating categories
    private BigDecimal ratingContent;
    private BigDecimal ratingTeaching;
    private BigDecimal ratingAssignments;
    private BigDecimal ratingExams;
    
    // JSON arrays
    private List<String> tags;
    private List<String> prerequisites;

    // Getters and Setters
    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getUniversityId() {
        return universityId;
    }

    public void setUniversityId(Long universityId) {
        this.universityId = universityId;
    }

    public String getUniversityName() {
        return universityName;
    }

    public void setUniversityName(String universityName) {
        this.universityName = universityName;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public void setProfessorId(Long professorId) {
        this.professorId = professorId;
    }

    public String getProfessorName() {
        return professorName;
    }

    public void setProfessorName(String professorName) {
        this.professorName = professorName;
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


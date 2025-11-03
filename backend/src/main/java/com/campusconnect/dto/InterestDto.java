package com.campusconnect.dto;

public class InterestDto {
    private Long interestId;
    private String name;

    public InterestDto() {} // no-args

    public InterestDto(Long interestId, String name) {
        this.interestId = interestId;
        this.name = name;
    }

    // Getters and Setters
    public Long getInterestId() { return interestId; }
    public void setInterestId(Long interestId) { this.interestId = interestId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
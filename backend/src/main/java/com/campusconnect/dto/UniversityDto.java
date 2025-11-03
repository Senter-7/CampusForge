package com.campusconnect.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityDto {

    private Long universityId;
    private String name;
    private String location;
    private String city;
    private String state;
    private String country;
}

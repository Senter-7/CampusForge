package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "universities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "university_id")
    private Long universityId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String location;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    // Optional reverse mappings — you can include them if you want bidirectional relationships
    @OneToMany(mappedBy = "university", fetch = FetchType.LAZY)
    private List<User> users;

    @OneToMany(mappedBy = "university", fetch = FetchType.LAZY)
    private List<Professor> professors;
}

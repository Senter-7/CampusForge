package com.campusconnect.controller;

import com.campusconnect.dto.InterestDto;
import com.campusconnect.service.InterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interests")
public class InterestController {

    @Autowired
    private InterestService interestService;

    @PostMapping
    public InterestDto createInterest(@RequestBody InterestDto interestDto) {
        return interestService.createInterest(interestDto);
    }

    @GetMapping
    public List<InterestDto> getAllInterests() {
        return interestService.getAllInterests();
    }

    @GetMapping("/{id}")
    public InterestDto getInterestById(@PathVariable Long id) {
        return interestService.getInterestById(id);
    }
}
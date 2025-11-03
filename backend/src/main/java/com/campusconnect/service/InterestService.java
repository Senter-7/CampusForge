package com.campusconnect.service;

import com.campusconnect.entity.Interest;
import com.campusconnect.dto.InterestDto;
import com.campusconnect.repository.InterestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InterestService {
    @Autowired
    private InterestRepository interestRepository;

    public InterestDto createInterest(InterestDto interestDto) {
        Interest interest = new Interest();
        interest.setName(interestDto.getName());
        Interest saved = interestRepository.save(interest);
        InterestDto result = new InterestDto();
        result.setInterestId(saved.getInterestId());
        result.setName(saved.getName());
        return result;
    }

    public List<InterestDto> getAllInterests() {
        return interestRepository.findAll().stream().map(interest -> {
            InterestDto dto = new InterestDto();
            dto.setInterestId(interest.getInterestId());
            dto.setName(interest.getName());
            return dto;
        }).collect(Collectors.toList());
    }

    public InterestDto getInterestById(Long id) {
        Interest interest = interestRepository.findById(id).orElse(null);
        if (interest == null) return null;
        InterestDto dto = new InterestDto();
        dto.setInterestId(interest.getInterestId());
        dto.setName(interest.getName());
        return dto;
    }
}
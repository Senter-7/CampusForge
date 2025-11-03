package com.campusconnect.service;

import com.campusconnect.entity.Skill;
import com.campusconnect.dto.SkillDto;
import com.campusconnect.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SkillService {
    @Autowired
    private SkillRepository skillRepository;

    public SkillDto createSkill(SkillDto skillDto) {
        Skill skill = new Skill();
        skill.setName(skillDto.getName());
        Skill saved = skillRepository.save(skill);
        SkillDto result = new SkillDto();
        result.setSkillId(saved.getSkillId());
        result.setName(saved.getName());
        return result;
    }

    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream().map(skill -> {
            SkillDto dto = new SkillDto();
            dto.setSkillId(skill.getSkillId());
            dto.setName(skill.getName());
            return dto;
        }).collect(Collectors.toList());
    }

    public SkillDto getSkillById(Long id) {
        Skill skill = skillRepository.findById(id).orElse(null);
        if (skill == null) return null;
        SkillDto dto = new SkillDto();
        dto.setSkillId(skill.getSkillId());
        dto.setName(skill.getName());
        return dto;
    }
}
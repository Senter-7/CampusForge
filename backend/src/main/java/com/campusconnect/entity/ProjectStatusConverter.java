package com.campusconnect.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ProjectStatusConverter implements AttributeConverter<Project.Status, String> {

    @Override
    public String convertToDatabaseColumn(Project.Status status) {
        if (status == null) {
            return null;
        }
        return status.name().toLowerCase();
    }

    @Override
    public Project.Status convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return Project.Status.OPEN; // Default value
        }
        try {
            // Convert to uppercase to match Java enum
            return Project.Status.valueOf(dbData.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            // If invalid, default to OPEN
            return Project.Status.OPEN;
        }
    }
}


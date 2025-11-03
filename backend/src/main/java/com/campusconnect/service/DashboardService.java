package com.campusconnect.service;

import com.campusconnect.dto.DashboardDto;

public interface DashboardService {
    DashboardDto getDashboardForUser(Long userId);
}

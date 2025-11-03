package com.campusconnect.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/ping")
    public String ping() {
        return "✅ Server is running fine!";
    }
    @GetMapping("/test-error")
    public String testError() {
        throw new RuntimeException("Something went wrong!");
    }
}

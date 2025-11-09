package com.campusconnect.controller;

import com.campusconnect.dto.UserDto;
import com.campusconnect.security.UserPrincipal;
import com.campusconnect.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/search")
    public List<UserDto> searchUsers(@RequestParam(required = false) String name, 
                                     @RequestParam(required = false) String skill) {
        return userService.searchUsers(name, skill);
    }

    // ✅ Get teammates (public endpoint for FindTeammates page)
    @GetMapping("/teammates")
    public List<UserDto> getTeammates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String availability) {
        return userService.getTeammates(search, major, year, availability);
    }

    // ✅ Update last seen (for online status)
    @PostMapping("/{id}/last-seen")
    @PreAuthorize("#id == authentication.principal.id")
    public ResponseEntity<String> updateLastSeen(@PathVariable Long id) {
        userService.updateLastSeen(id);
        return ResponseEntity.ok("Last seen updated");
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto userDto) {
        return ResponseEntity.ok(userService.updateUser(id, userDto));
    }

    // ✅ Delete own account (users can only delete their own account)
    @DeleteMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.id or hasRole('ADMIN')")
    public ResponseEntity<String> deleteAccount(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        // Double-check: users can only delete their own account (unless admin)
        if (currentUser != null && !currentUser.getId().equals(id) && 
            !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new RuntimeException("You can only delete your own account");
        }
        userService.deleteUser(id);
        return ResponseEntity.ok("Account deleted successfully");
    }
}
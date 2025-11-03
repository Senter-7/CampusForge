package com.campusconnect.security;

import com.campusconnect.entity.Rating;
import com.campusconnect.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component("ratingSecurity")
@RequiredArgsConstructor
public class RatingSecurity {

    private final RatingRepository ratingRepository;

    public boolean isOwnerOrAdmin(Long ratingId, Long userId, java.util.Collection<? extends GrantedAuthority> authorities) {
        Rating rating = ratingRepository.findById(ratingId).orElse(null);
        if (rating == null) return false;

        // Allow admin
        boolean isAdmin = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // Allow owner
        return isAdmin || rating.getUser().getUserId().equals(userId);
    }
}

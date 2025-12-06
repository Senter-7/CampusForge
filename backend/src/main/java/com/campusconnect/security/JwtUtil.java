package com.campusconnect.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET = "your_very_secret_jwt_key_which_should_be_32_chars_minimum";
    private static final long EXPIRATION_TIME = 86400000; // 1 day in ms
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes()); // ✅ Use SecretKey

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key) // ✅ No algorithm argument needed in latest JJWT
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return parseClaims(token).getSubject();
        } catch (ExpiredJwtException e) {
            // Token expired, but we can still extract username from expired token
            return e.getClaims().getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public String extractRole(String token) {
        try {
            return parseClaims(token).get("role", String.class);
        } catch (ExpiredJwtException e) {
            // Token expired, but we can still extract role from expired token
            return e.getClaims().get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            // Token is expired
            return false;
        } catch (Exception e) {
            // Token is invalid for other reasons
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            parseClaims(token);
            return false;
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return false; // If we can't parse, consider it not expired but invalid
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key) // ✅ expects SecretKey
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

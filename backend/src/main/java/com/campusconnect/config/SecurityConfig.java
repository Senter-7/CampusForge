package com.campusconnect.config;

import com.campusconnect.security.JwtAuthenticationFilter;
import com.campusconnect.security.CustomUserDetailsService;
import com.campusconnect.security.JwtUtil;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.*;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import java.util.List;


@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@EnableMethodSecurity // ✅ Enables @PreAuthorize, @Secured, etc.
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
            var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                List<String> allowedOrigins = List.of(
                    System.getenv().getOrDefault("CORS_ALLOWED_ORIGINS",
                        "http://localhost:3000").split(",")
            );
        
            corsConfig.setAllowedOrigins(allowedOrigins);
            corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
            corsConfig.setAllowedHeaders(List.of("*"));
            corsConfig.setAllowCredentials(true);
            return corsConfig;
            }))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ✅ Allow OPTIONS requests for CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ✅ Public endpoints (no auth required)
                .requestMatchers(
                    "/api/auth/**",              // login/register
                    "/api/public/**",            // public search endpoints
                    "/api/universities",         // GET all universities (public for registration)
                    "/api/universities/{id}",    // GET university by ID (public)
                    "/api/projects",             // GET all projects (public)
                    "/api/projects/{id}",        // GET project by ID (public)
                    "/api/skills",               // GET all skills (public)
                    "/api/interests",            // GET all interests (public)
                    "/api/professors",           // GET all professors (public) - GET only
                    "/api/professors/{id}",      // GET professor by ID (public)
                    "/api/courses",              // GET all courses (public) - GET only
                    "/api/courses/{id}",         // GET course by ID (public)
                    "/api/course-details",       // GET all course details (public) - GET only
                    "/api/course-details/{id}",  // GET course detail by ID (public)
                    "/api/course-details/professor/{professorId}", // GET course details by professor (public)
                    "/api/course-details/university/{universityId}", // GET course details by university (public)
                    "/api/course-details/search", // GET search course details (public)
                    "/api/ratings/professor/{id}", // GET ratings by professor (public)
                    "/api/ratings/course/{id}",   // GET ratings by course (public)
                    "/api/users/teammates",       // GET teammates (public for FindTeammates page)
                    "/ws/**"                     // WebSocket endpoint
                ).permitAll()

                // ✅ Role-based (authenticated)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/student/**").hasRole("STUDENT")

                // ✅ Everything else must be authenticated (includes POST/PUT/DELETE for professors and courses)
                .anyRequest().authenticated()
            )
            // ✅ Add JWT filter before default authentication
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtUtil, userDetailsService);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

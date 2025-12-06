package com.campusconnect.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Logs database connection information at startup for debugging Railway deployments.
 */
@Component
public class DatabaseConnectionLogger {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnectionLogger.class);
    private final Environment environment;

    public DatabaseConnectionLogger(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseConnectionInfo() {
        logger.info("=== Database Connection Configuration ===");
        
        // Log environment variables
        Map<String, String> env = System.getenv();
        logger.info("MYSQLHOST: {}", env.getOrDefault("MYSQLHOST", "NOT SET"));
        logger.info("MYSQLPORT: {}", env.getOrDefault("MYSQLPORT", "NOT SET"));
        logger.info("MYSQLDATABASE: {}", env.getOrDefault("MYSQLDATABASE", "NOT SET"));
        logger.info("MYSQLUSER: {}", env.getOrDefault("MYSQLUSER", "NOT SET"));
        
        // Safe null check for password
        String mysqlPassword = env.get("MYSQLPASSWORD");
        logger.info("MYSQLPASSWORD: {}", (mysqlPassword != null && !mysqlPassword.isEmpty()) ? "SET (hidden)" : "NOT SET");
        
        // Safe null check for DATABASE_URL
        String databaseUrl = env.get("DATABASE_URL");
        logger.info("DATABASE_URL: {}", (databaseUrl != null && !databaseUrl.isEmpty()) ? "SET (hidden)" : "NOT SET");
        
        // Log resolved properties
        String activeProfile = environment.getProperty("spring.profiles.active", "default");
        logger.info("Active Profile: {}", activeProfile);
        
        try {
            String datasourceUrl = environment.getProperty("spring.datasource.url", "NOT SET");
            // Mask password in URL if present
            if (datasourceUrl.contains("@")) {
                datasourceUrl = datasourceUrl.replaceAll(":[^:@]+@", ":****@");
            }
            logger.info("Resolved JDBC URL: {}", datasourceUrl);
            logger.info("Resolved Username: {}", environment.getProperty("spring.datasource.username", "NOT SET"));
        } catch (Exception e) {
            logger.warn("Could not log datasource configuration: {}", e.getMessage());
        }
        
        logger.info("========================================");
    }
}


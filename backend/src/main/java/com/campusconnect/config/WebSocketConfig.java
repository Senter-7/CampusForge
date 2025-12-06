package com.campusconnect.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;
    private final Environment environment;

    @Autowired
    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor, Environment environment) {
        this.authInterceptor = authInterceptor;
        this.environment = environment;
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker to carry messages back to the client
        // on destinations prefixed with "/topic" or "/queue"
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Get allowed origins from environment variable or use default
        String allowedOriginsEnv = environment.getProperty("WEBSOCKET_ALLOWED_ORIGINS", 
            environment.getProperty("CORS_ALLOWED_ORIGINS", "http://localhost:3000"));
        
        List<String> allowedOrigins = Arrays.asList(allowedOriginsEnv.split(","));
        
        // Register the "/ws" endpoint, enabling SockJS fallback options
        // so that alternate transports can be used if WebSocket is not available
        String[] originsArray = allowedOrigins.toArray(new String[0]);
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(originsArray)
                .withSockJS()
                .setHeartbeatTime(25000) // 25 seconds
                .setDisconnectDelay(5000); // 5 seconds
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        // Register the authentication interceptor
        registration.interceptors(authInterceptor);
    }
}


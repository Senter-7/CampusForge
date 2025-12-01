# Use official Maven image with Java 17
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy backend directory
COPY ./backend ./backend

# Move into backend and build
WORKDIR /app/backend
RUN chmod +x mvnw
RUN ./mvnw -DskipTests package

# Run stage
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copy built jar from previous stage
COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080

# Start Spring Boot
CMD ["java", "-jar", "app.jar"]

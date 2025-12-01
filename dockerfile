# Use official Maven image with Java 17
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

COPY ./backend ./backend

WORKDIR /app/backend

# Fix Windows CRLF issue
RUN sed -i 's/\r$//' mvnw

# Ensure mvnw is executable
RUN chmod +x mvnw

# Build the project
RUN ./mvnw -DskipTests package

# ==========================
# Run Stage
# ==========================

FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]

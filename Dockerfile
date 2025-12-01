# ---------- STAGE 1: Build ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy only backend directory
COPY backend ./backend

WORKDIR /app/backend

# Build Spring Boot jar using Maven (NOT mvnw)
RUN mvn -DskipTests package

# ---------- STAGE 2: Run ----------
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

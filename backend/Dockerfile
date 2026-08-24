# =========================================================================
# CollabMatrix Spring Boot Modular Monolith Backend Multi-Stage Dockerfile
# =========================================================================

# --- Stage 1: Build parent POM and all submodules ---
FROM maven:3.8.5-openjdk-17 AS builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests=true

# --- Stage 2: Lightweight JRE runner ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/collab-core/target/collab-core-1.0.0-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Xss512k -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

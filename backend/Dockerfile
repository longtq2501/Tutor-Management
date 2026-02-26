# Stage 1: Build với Maven và Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng với Java 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dserver.port=${PORT:-8080}", "app.jar"]
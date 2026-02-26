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

# Dùng Shell form để hỗ trợ mở rộng biến môi trường (PORT)
# -Xmx384m: Giới hạn RAM cho Java để không bị kill trên Render Free (512MB RAM)
# -Dspring.profiles.active=prod: Tự động chạy chế độ production
ENTRYPOINT ["sh", "-c", "java -Xms180m -Xmx180m -XX:+UseSerialGC -Xss256k -XX:MaxMetaspaceSize=160m -Dserver.port=${PORT:-8080} -Dspring.profiles.active=prod -jar app.jar"]

FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew --no-daemon clean bootJar -x test

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/build/libs/*-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]

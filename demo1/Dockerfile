FROM gradle:7.2-jdk17 AS build
COPY . /home/gradle/src
WORKDIR /home/gradle/src
RUN ls -l
RUN chmod +x gradlew
RUN ./gradlew build --no-daemon

FROM openjdk:17-jdk
COPY --from=build /home/gradle/src/build/libs/*.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
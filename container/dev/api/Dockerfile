FROM amazoncorretto:21-alpine
WORKDIR /app
COPY api/build/libs/*-all.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dconfig.file=application-prod.yaml", "-jar", "app.jar"]
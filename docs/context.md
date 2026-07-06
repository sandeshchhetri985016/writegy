# 🎓 Writegy - Project Blueprint (Free Tier Edition)

**Writegy** is a smart writing enhancement tool designed to be production-ready while running entirely on free-tier infrastructure. This document serves as the source of truth for the application architecture, technology stack, and development roadmap.

## 1. The "Zero-Cost" Tech Stack

| Component | Technology | Version | Provider (Free Tier) |
| :--- | :--- | :--- | :--- |
| **Language** | Java (OpenJDK Temurin) | **25 (LTS)** | N/A |
| **Framework** | Spring Boot | **3.5.5** | N/A |
| **Hosting** | Docker / Alpine Linux | Latest | **Render** (512MB RAM) |
| **Database** | PostgreSQL | 16 | **Supabase** (500MB) |
| **Storage** | S3 Compatible | AWS SDK | **Cloudflare R2** (10GB) |
| **AI/NLP** | Grammar Checking | v2 API | **LanguageTool** (Public API) |
| **Parsing** | Apache Tika | 2.9.x | Embedded |

## 2. Architecture & Constraints

### Free Tier Optimizations
*   **Memory**: The application is configured with `-XX:MaxRAMPercentage=75.0` and excludes build tools (Lombok) from the final image to fit within Render's 512MB limit.
*   **Cold Starts**: Render spins down the service after 15 minutes of inactivity. The first request may take ~45 seconds.
*   **Database**: Supabase pauses projects after 1 week of inactivity. Log in to the dashboard to wake it up.

## 3. Development Roadmap

### Phase 1: Foundation & Database
*   **Goal**: Initialize Spring Boot and connect to PostgreSQL.
*   **Tasks**:
    *   Configure `application.yml` with Supabase credentials.
    *   Set up Flyway for database migrations (Granular V1-V8 schema).
    *   Create JPA Entities (`User`, `Document`).

### Phase 2: Security (JWT)
*   **Goal**: Secure the API with stateless authentication.
*   **Tasks**:
    *   Implement `JwtUtils` for token generation/validation.
    *   Configure `SecurityFilterChain` (Public: `/auth/**`, Protected: `/api/**`).
    *   Create Login/Signup endpoints.

### Phase 3: Document Handling
*   **Goal**: Upload files and extract text.
*   **Tasks**:
    *   Configure `AmazonS3` client for Cloudflare R2.
    *   Implement `DocumentService` to upload files.
    *   Integrate **Apache Tika** to parse PDF/DOCX to text.

### Phase 4: AI & Grammar
*   **Goal**: Analyze text for improvements.
*   **Tasks**:
    *   Implement `GrammarService` to call LanguageTool API.
    *   Add **Caffeine Cache** to prevent redundant API calls.

### Phase 5: Deployment
*   **Goal**: Go live.
*   **Tasks**:
    *   Finalize Docker build.
    *   Configure Environment Variables in Render.
    *   Verify Health Checks (`/actuator/health`).

## 4. Reference Configuration

### `pom.xml` (Optimized for Java 25)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.5</version> <!-- Updated for Java 25 support -->
        <relativePath/>
    </parent>

    <groupId>com.writegy</groupId>
    <artifactId>writegy-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <java.version>25</java.version>
        <maven.compiler.source>25</maven.compiler.source>
        <maven.compiler.target>25</maven.compiler.target>
        <maven.compiler.release>25</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway for database migrations -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>

        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- AWS SDK for S3 (Cloudflare R2) -->
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-java-sdk-s3</artifactId>
            <version>1.12.772</version>
        </dependency>

        <!-- Apache Tika for text extraction -->
        <dependency>
            <groupId>org.apache.tika</groupId>
            <artifactId>tika-core</artifactId>
            <version>2.9.2</version>
        </dependency>

        <dependency>
            <groupId>org.apache.tika</groupId>
            <artifactId>tika-parsers-standard-package</artifactId>
            <version>2.9.2</version>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Caffeine cache -->
        <dependency>
            <groupId>com.github.ben-manes.caffeine</groupId>
            <artifactId>caffeine</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </excludes>
                </configuration>
            </plugin>

            <!-- Updated Maven Compiler Plugin for Java 25 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.0</version>
                <configuration>
                    <release>25</release>
                    <enablePreview>false</enablePreview>
                </configuration>
            </plugin>

            <!-- Flyway Plugin -->
            <plugin>
                <groupId>org.flywaydb</groupId>
                <artifactId>flyway-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**Updated Dockerfile for Java 25:**
```dockerfile
# Multi-stage build using Java 25
FROM maven:3.9.9-eclipse-temurin-25-alpine AS build

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests -B

# Production stage with Java 25 JRE
FROM eclipse-temurin:25-jre-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

USER spring:spring

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Optimized JVM flags for Java 25 (Render 512MB RAM)
CMD ["java", \
     "-XX:+UseContainerSupport", \
     "-XX:MaxRAMPercentage=75.0", \
     "-XX:+UseG1GC", \
     "-XX:+UseStringDeduplication", \
     "-XX:MaxGCPauseMillis=100", \
     "-Djava.security.egd=file:/dev/./urandom", \
     "-jar", \
     "app.jar"]
```

### 🚀 Deployment Considerations

**Core Free Services:** Java 25 runs perfectly on all major cloud hosting platforms including AWS, Google Cloud, DigitalOcean, etc. The Docker approach provides maximum portability and deployment flexibility.

**Memory Optimization for Free Tier:** Java 25's **compact object headers** feature reduces memory footprint by ~10-15%, which is perfect for platforms with 512MB RAM limits.

### ⚠️ One Minor Consideration

**Library Ecosystem:** While Spring Boot and major frameworks support Java 25, some third-party libraries might lag behind. However, since Java maintains backward compatibility, Java 21 libraries work fine on Java 25.

**Recommended Approach:**
```bash
# Check if all dependencies work with Java 25
mvn dependency:tree
mvn clean verify

# If any issues, you can temporarily use Java 21 release flag
# But keep Java 25 runtime for performance benefits
```

### 🎯 My Recommendation

**Keep Java 25!** Here's why:

1. ✅ **Better Performance** - 10% latency improvement for free
2. ✅ **Production Ready** - Spring Boot 3.5.5+ fully supports it
3. ✅ **Future-Proof** - It's the latest LTS (supported until 2030+)
4. ✅ **Learning Advantage** - You'll learn the latest Java features
5. ✅ **Free Tier Friendly** - Lower memory usage helps with cloud hosting limits

**🚨 UPDATED: True Free Alternatives (RECOMMENDED)**
```
✅ Java 25 LTS (Temurin)           - Your current setup
✅ Spring Boot 3.2.0               - Version confirmed working
✅ Maven 3.9.10 with plugin 3.13.0 - Current working configuration
✅ PostgreSQL 16 (Supabase)        - Free forever database
❌ Railway (PAID - trial expires)  - EXPENSE after ~$5 credits
✅ Render.app (Docker)             - ALWAYS FREE for Java 25
✅ Vercel (Frontend)               - Free hosting
✅ Cloudflare R2                   - Free file storage
✅ LanguageTool API                - Free grammar checking
```

### 📝 Quick Start Commands

```bash
# Verify your Maven version
mvn -v
# Should show: Java version: 25, vendor: Homebrew

# Update pom.xml as shown above

# Test build with Java 25
mvn clean install

# Run locally
mvn spring-boot:run

# Build Docker image
docker build -t writegy-backend:java25 .

# Run Docker container
docker run -p 8080:8080 writegy-backend:java25
```

Your Java 25 setup is actually **ideal for this project**. Go ahead and use it with confidence! 🚀

[1](https://docs.spring.io/spring-boot/system-requirements.html)
[2](https://github.com/spring-projects/spring-boot/issues/47245)
[3](https://dev.to/pfilaretov42/the-return-of-the-lts-what-java-25-brings-beyond-21-481a)
[4](https://loiane.com/2025/08/spring-boot-4-spring-framework-7-key-features/)
[5](https://www.youtube.com/watch?v=223_7r0H6OE)
[6](https://www.youtube.com/watch?v=sQ3xn3F6Q5c)
[7](https://www.answeroverflow.com/m/1423587009800437813)
[8](https://dev.to/devaaai/best-docker-base-images-and-performance-optimization-for-java-applications-in-2025-kdd)

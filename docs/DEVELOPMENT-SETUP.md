# 🛠️ Writegy Development Setup Guide

**Complete step-by-step guide for Java beginners to set up and run Writegy.** Designed for people new to Java who want to understand and run this project.

## 🎯 **Goal: Running Java Backend in 30 Minutes**

By the end of this guide, you'll have:
- ✅ Java 25 installed and working
- ✅ A working Spring Boot backend
- ✅ API endpoints you can test
- ✅ Understanding of what each file does

---

## 📋 **Prerequisites Check**

### **Step 1: Check What's Already Installed**

Open your terminal/command prompt and run:

```bash
# Check Java version
java -version

# Check if Maven is installed
mvn -version

# Check if Git is installed
git --version
```

**Expected Results:**
- Java: Shows version (should be 25 or higher)
- Maven: Shows version 3.9+
- Git: Shows version info

**❌ Missing something?** Don't worry! We'll install it.

---

## 🚀 **Installation Guide**

### **Windows Users:**

#### **1. Install Java 25 (Temurin Distribution)**
```bash
# Download from:
# https://adoptium.net/temurin/releases/?version=25

# Or use Chocolatey (if you have it):
choco install temurin25
```

#### **2. Install Maven**
```bash
# Download from:
# https://maven.apache.org/download.cgi

# Add to PATH environment variable
# Usually: C:\Program Files\Apache\Maven\bin
```

#### **3. Install Git**
```bash
# Download from:
# https://git-scm.com/downloads

# Or use Chocolatey:
choco install git
```

### **macOS Users:**

#### **1. Install Java 25**
```bash
# Use Homebrew
brew tap homebrew/cask-versions
brew install --cask temurin25

# Verify
java -version
# Should show: openjdk 25.x.x
```

#### **2. Install Maven**
```bash
# Use Homebrew
brew install maven

# Verify
mvn -version
```

#### **3. Install Git** (usually pre-installed)
```bash
git --version
```

### **Linux Users:**

#### **1. Install Java 25**
```bash
# Ubuntu/Debian
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb focal main" | tee /etc/apt/sources.list.d/adoptium.list
apt update
apt install temurin-25-jdk

# CentOS/RHEL
# Download from: https://adoptium.net/temurin/releases/
```

#### **2. Install Maven**
```bash
# Ubuntu/Debian
apt install maven

# CentOS/RHEL
yum install maven
```

---

## 🏗️ **Project Setup**

### **Step 1: Download the Project**
```bash
# Clone the repository
git clone https://github.com/sandeshchhetri985016/writegy.git

# Go into the project folder
cd writegy
```

### **Step 2: Navigate to Backend**
```bash
# All our work will be in the backend folder
cd backend
```

### **Step 3: First Build**
```bash
# This downloads all dependencies and compiles
mvn clean install
```

**Expected Output:**
- Lots of downloading (first time only)
- Ends with: `BUILD SUCCESS`

**❌ If it fails:** Check your Java/Maven installation above.

---

## 🏃‍♂️ **Running the Application**

### **Method 1: Direct Spring Boot (Recommended for Learning)**
```bash
# Run the application
mvn spring-boot:run -Dspring.profiles.active=dev
```

**Expected Output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.5.5)

2025-12-12 21:35:32.123  INFO Starting WritegyApplication on...
2025-12-12 21:35:32.456  INFO Started WritegyApplication in 3.247 seconds
```

**🎉 Your app is running!**

### **Method 2: Docker (For Production Testing)**
```bash
# Build Docker image
docker build -t writegy-backend .

# Run in Docker
docker run -p 8080:8080 writegy-backend
```

---

## 🧪 **Testing Your First API**

### **Terminal 1: Keep Server Running**
Your Spring Boot app should still be running from above.

### **Terminal 2: Test the API**

#### **Test 1: Get All Documents**
```bash
curl http://localhost:8080/api/documents
```

**Expected Response:**
```json
[]
```
(Empty array - normal, no documents yet!)

#### **Test 2: Create Your First Document**
```bash
# Create a dummy file first
echo "Hello from Java 25!" > test.txt

curl -X POST http://localhost:8080/api/documents/upload \
  -F "file=@test.txt" \
  -F "title=My First Java API"
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "My First Java API",
  "content": "Hello from Java 25!",
  "createdAt": "2025-12-12T10:35:00Z"
}
```

#### **Test 3: Get All Documents Again**
```bash
curl http://localhost:8080/api/documents
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "title": "My First Java API",
    "content": "Hello from Java 25!",
    "createdAt": "2025-12-12T10:35:00Z"
  }
]
```

**🎉 You just built and tested a working Java API!**

#### **Test 4: Health Check**
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response:**
```json
{
  "status": "UP"
}
```

---

## 📁 **Understanding the Code (Java Beginner Friendly)**

### **The 4 Files You Need to Know:**

```
backend/
├── src/main/java/com/writegy/
│   └── 📄 WritegyApplication.java    ← "App Starter"
├── src/main/java/com/writegy/controller/
│   └── 📄 DocumentController.java    ← "API Logic"
└── src/main/resources/
    └── 📄 application-dev.yml         ← "Settings"
```

### **1. WritegyApplication.java** ⭐ (2 lines!)
```java
package com.writegy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication  // ← This tells Spring "I'm the main app!"
public class WritegyApplication {
    public static void main(String[] args) {
        SpringApplication.run(WritegyApplication.class, args);
        //                   ↑ "Run this class when app starts"
    }
}
```

**What it does:** Starts your entire Spring Boot application. Everything begins here!

### **2. DocumentController.java** ⭐⭐ (REST API)
```java
package com.writegy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

// Simple Document DTO for MVP
class SimpleDocument {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;

    // Constructor, getters, setters...
}

@RestController                           // ← "I'm a web controller!"
@RequestMapping("/api/documents")         // ← "Listen at /api/documents"
public class DocumentController {

    private final AtomicLong counter = new AtomicLong();
    private List<SimpleDocument> documents = new java.util.concurrent.CopyOnWriteArrayList<>();

    @GetMapping                           // ← "Respond to GET requests"
    public ResponseEntity<List<SimpleDocument>> getAllDocuments() {
        return ResponseEntity.ok(documents);  // ← "Return all documents"
    }

    @PostMapping                          // ← "Respond to POST requests"
    public ResponseEntity<SimpleDocument> createDocument(@RequestBody SimpleDocument document) {
        Long id = counter.incrementAndGet();
        document.setId(id);
        document.setCreatedAt(LocalDateTime.now());
        documents.add(document);
        return ResponseEntity.ok(document);   // ← "Return the new document"
    }

    // More methods for GET/PUT/DELETE by ID...
}
```

**What it does:** Handles all the API endpoints. Like a waiter taking orders and serving food!

### **3. application-dev.yml** ⭐ (Configuration)
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb    # ← "Use H2 memory database"
    driverClassName: org.h2.Driver
    username: sa
    password:

# No setup needed - H2 is embedded!
```

**What it does:** Tells Spring how to connect to the database.

---

## 🔧 **Development Workflow**

### **Daily Development:**
```bash
# 1. Make code changes
# (Edit Java files, restart app)

# 2. Test your changes
mvn clean install

# 3. Run updated version
mvn spring-boot:run -Dspring.profiles.active=dev

# 4. Test the Hybrid API
# Upload file + pre-extracted content (from frontend simulation)
curl -X POST http://localhost:8080/api/documents \
  -F "file=@document.pdf" \
  -F "title=My Research Paper" \
  -F "content=This is the pre-extracted text..."
```

### **Quick Restart (Hot Reload):**
- Save your Java files
- Spring Boot auto-restarts (if running)
- Or manually restart: `mvn spring-boot:run -Dspring.profiles.active=dev`

### **Debugging Tips:**

#### **Check Server Logs:**
The terminal running your app shows errors and debug info.

#### **Common Issues:**

**❌ Port 8080 already in use:**
```bash
# Find process using port
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # macOS/Linux

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F         # Windows
kill <PID>                    # macOS/Linux
```

**❌ Build fails:**
```bash
# Clean and try again
mvn clean install

# Run without tests (faster for debugging)
mvn clean compile
mvn spring-boot:run -Dspring.profiles.active=dev
```

**❌ API returns errors:**
- Check if server is running: `curl localhost:8080/actuator/health`
- Check port 8080 is accessible
- Verify JSON format in POST requests

---

## 🧠 **Learning Plan**

### **Week 1: Java Basics**
1. ✅ Understand `WritegyApplication.java` (main method)
2. ✅ Learn variables and methods (in controllers)
3. ✅ Practice `curl` commands

### **Week 2: API Development**
1. ✅ Add new fields to `SimpleDocument`
2. ✅ Add validation logic
3. ✅ Add new endpoints

### **Week 3: Database Integration**
1. ✅ Switch from H2 to Supabase
2. ✅ Use real JPA entities
3. ✅ Connect real database

### **Week 4: Deploy & Share**
1. ✅ Deploy to Render
2. ✅ Add React frontend
3. ✅ Share with friends

---

## 🎓 **Java Concepts You'll Learn**

| Concept | Where You See It | Easy Example |
|---------|------------------|--------------|
| **Classes** | `SimpleDocument` | Blueprint for objects |
| **Methods** | `getAllDocuments()` | Actions you can do |
| **Annotations** | `@RestController` | Special labels |
| **HTTP** | GET/POST/PUT/DELETE | Web communication |
| **JSON** | API responses | Data format |
| **Lists** | `List<SimpleDocument>` | Collections of items |

---

## 📚 **Helpful Resources**

### **Beginner Java:**
- [Java Tutorials](https://docs.oracle.com/javase/tutorial/)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [REST API Guide](https://restfulapi.net/)

### **Tools:**
- [Postman](https://postman.com) - API testing GUI
- [IntelliJ IDEA](https://jetbrains.com/idea/) - Java IDE (Community free)

### **Community:**
- Stack Overflow
- Reddit r/java
- Spring Boot Discord

---

## 🚨 **Emergency Help**

### **"I can't install Java!"**
- Download from: https://adoptium.net/
- Choose "JDK 25.x.x" for your OS
- Add to system PATH

### **"Maven commands don't work!"**
- Run `mvn -version` to check installation
- On Windows: Add to PATH in environment variables
- On macOS: `brew install maven`

### **"Server won't start!"**
```bash
# Check for errors
mvn spring-boot:run -Dspring.profiles.active=dev

# Common fixes:
# 1. Check port 8080 is free
# 2. Verify Java 25 is installed
# 3. Try clean build: mvn clean install
```

---

## ✅ **Success Checklist**

- ✅ Java 25 installed (`java -version` shows 25)
- ✅ Maven working (`mvn -version` works)
- ✅ Project cloned (`cd writegy/backend`)
- ✅ App builds (`mvn clean install` succeeds)
- ✅ Server starts (`mvn spring-boot:run` works)
- ✅ API responds (`curl localhost:8080/api/documents` works)
- ✅ Can create documents (POST request works)

**🎉 Check them all off? You're officially a Java developer!**

---

**Next step:** [Head to API-REFERENCE.md](API-REFERENCE.md) to learn all the API endpoints you can test.

**Stuck?** Ask for help - this guide is for complete beginners! 🚀

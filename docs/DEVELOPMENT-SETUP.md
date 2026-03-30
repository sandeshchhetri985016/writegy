# 🛠️ Writegy Development Setup Guide

**Complete step-by-step guide for Java beginners to set up and run Writegy.** Designed for people new to Java who want to understand and run this project.

## 🎯 **Goal: Running Java Backend in 30 Minutes**

By the end of this guide, you'll have:
- ✅ Java 21 installed and working
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

# Check if Node.js is installed (for frontend)
node --version
npm --version
```

**Expected Results:**
- Java: Shows version 21 or higher (Temurin distribution recommended)
- Maven: Shows version 3.9+
- Git: Shows version info
- Node.js: Shows version (should be 18+ for frontend)

**❌ Missing something?** Don't worry! We'll install it.

---

## 🚀 **Installation Guide**

### **Windows Users:**

#### **1. Install Java 21 (Temurin Distribution)**
```bash
# Download from:
# https://adoptium.net/temurin/releases/?version=21

# Or use Chocolatey (if you have it):
choco install temurin21
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

#### **4. Install Node.js (for frontend)**
```bash
# Download from:
# https://nodejs.org/en/download/

# Or use Chocolatey:
choco install nodejs-lts
```

### **macOS Users:**

#### **1. Install Java 21**
```bash
# Use Homebrew
brew tap homebrew/cask-versions
brew install --cask temurin21

# Verify
java -version
# Should show: openjdk 21.x.x
```

#### **2. Install Maven**
```bash
# Use Homebrew
brew install maven

# Verify
mvn -version
```

#### **3. Install Git (usually pre-installed)**
```bash
git --version
```

#### **4. Install Node.js (for frontend)**
```bash
# Use Homebrew
brew install node

# Verify
node --version
npm --version
```

### **Linux Users:**

#### **1. Install Java 21**
```bash
# Ubuntu/Debian
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb focal main" | tee /etc/apt/sources.list.d/adoptium.list
apt update
apt install temurin-21-jdk

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

#### **3. Install Git**
```bash
# Ubuntu/Debian
apt install git

# CentOS/RHEL
yum install git
```

#### **4. Install Node.js (for frontend)**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo -E bash -
sudo yum install -y nodejs

# Verify
node --version
npm --version
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

### **Step 4: Verify Backend Setup**
```bash
# Check if backend is working
mvn spring-boot:run -Dspring.profiles.active=dev &
sleep 5
curl http://localhost:8080/actuator/health
kill %1
```

**Expected Output:**
```json
{
  "status": "UP"
}
```

### **Step 5: Navigate to Frontend**
```bash
# Go to frontend folder
cd ../frontend
```

### **Step 6: Install Frontend Dependencies**
```bash
# Install Node.js dependencies
npm install
```

**Expected Output:**
- Lots of downloading (first time only)
- Ends with: `added X packages in Y seconds`

---

## 🏃‍♂️ **Running the Application**

### **Method 1: Direct Spring Boot (Backend)**
```bash
# Run the backend application
cd backend
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

[DATE] 21:35:32.123  INFO Starting WritegyApplication on...
[DATE] 21:35:32.456  INFO Started WritegyApplication in 3.247 seconds
```

**🎉 Your backend is running!**

### **Method 2: Direct Node.js (Frontend)**
```bash
# Run the frontend application
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.4.9  ready in 1.2s

  Local:   http://localhost:5173/
  Network:  http://192.168.1.100:5173/
```

**🎉 Your frontend is running!**

### **Method 3: Docker Compose (Full Stack)**
```bash
# Build and run both services
docker-compose up --build
```

**Expected Output:**
- Backend running on http://localhost:8080
- Frontend running on http://localhost:5173

---

## 🧪 **Testing the Application**

### **Backend Testing**

Test your API endpoints with curl or Postman:

```bash
# Test health check
curl http://localhost:8080/actuator/health

# Test document endpoints
curl http://localhost:8080/api/documents

# Test document hierarchy endpoints
curl http://localhost:8080/api/documents/1/children

# Test authentication (after implementing)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

---

## 🧪 **Testing Your First API**

### **Terminal 1: Keep Backend Running**
Your Spring Boot app should still be running from above.

### **Terminal 2: Test the Backend API**

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
# Send a JSON payload to create a document
curl -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Document", "content":"This is the content of my first document."}'
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "My First Document",
  "content": "This is the content of my first document.",
  "createdAt": "[TIMESTAMP]"
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
    "title": "My First Document",
    "content": "This is the content of my first document.",
    "createdAt": "[TIMESTAMP]"
  }
]
```

**🎉 You just built and tested a working Java API!**

#### **Test 4: Word Count Calculation**
```bash
# Test word counting (should show wordCount and characterCount)
curl http://localhost:8080/api/documents
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "title": "My First Document",
    "content": "This is the content of my first document.",
    "wordCount": 8,
    "characterCount": 41,
    "status": "DRAFT",
    "createdAt": "[TIMESTAMP]",
    "updatedAt": "[TIMESTAMP]"
  }
]
```

#### **Test 5: Grammar Check (AI-Powered)**
```bash
# Test grammar checking with AI
curl -X POST http://localhost:8080/api/grammar/check \
  -H "Content-Type: application/json" \
  -d '{"text":"This is the body text to save anc check grammer"}'
```

**Expected Response:**
```
AI Grammar Analysis:
**Analysis Report**

**1. Grammar Errors and Spelling Mistakes**

* "anc" should be spelled as "and"
* "grammer" should be spelled as "grammar"
...
```

#### **Test 6: Health Check**
```bash
curl http://localhost:8080/actuator/health
```

**Expected Response:**
```json
{
  "status": "UP"
}
```

### **Terminal 3: Test the Frontend**

#### **Test 1: Start Frontend Development Server**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.4.9  ready in 1.2s

  Local:   http://localhost:5173/
  Network:  http://192.168.1.100:5173/
```

#### **Test 2: Open Browser**
- Open http://localhost:5173 in your browser
- Verify the application loads correctly
- Test basic functionality (navigation, buttons, etc.)

### **Full Stack Testing**

Test the complete application:

1. Start backend: `cd backend && mvn spring-boot:run -Dspring.profiles.active=dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Test complete user journey:
   - Register/login
   - Create document (both modes)
   - Upload file
   - Use grammar checking
   - Create child documents
   - Test auto-save
   - Verify accessibility features

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
// In a real project, this would typically be in its own file (e.g., src/main/java/com/writegy/dto/SimpleDocument.java)
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

### **4. package.json ⭐ (Frontend)**
```json
{
  "name": "writegy-frontend",
  "version": "1.0.0",
  "description": "AI-powered writing assistant frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.18",
    "@supabase/supabase-js": "^2.45.4",
    "axios": "^1.7.4",
    "lucide-react": "^0.378.0",
    "mammoth": "^1.4.21",
    "pdf-parse": "^1.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.2.3",
    "react-hot-toast": "^2.6.0",
    "react-markdown": "^10.1.0",
    "react-quill": "^2.0.0",
    "react-router-dom": "^6.26.1",
    "react-syntax-highlighter": "^16.1.0",
    "remark": "^15.0.1",
    "remark-gfm": "^4.0.1",
    "use-debounce": "^10.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.4.2"
  }
}
```

**What it does:** Manages frontend dependencies and scripts. Like a shopping list for your React app!

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

### **Frontend Development:**
```bash
# 1. Make code changes
# (Edit React files, save)

# 2. Test your changes
npm run dev

# 3. Hot reload happens automatically
# No need to restart, changes appear instantly
```

### **Full Stack Development:**
```bash
# 1. Start backend in one terminal
cd backend
mvn spring-boot:run -Dspring.profiles.active=dev

# 2. Start frontend in another terminal
cd frontend
npm run dev

# 3. Both services run simultaneously
# Backend: http://localhost:8080
# Frontend: http://localhost:5173
```

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

### **Week 5: Frontend Development**
1. ✅ Learn React basics
2. ✅ Understand component structure
3. ✅ Practice with the editor
4. ✅ Test accessibility features

### **Week 6: Full Stack Development**
1. ✅ Connect frontend to backend
2. ✅ Test complete user journey
3. ✅ Debug common issues
4. ✅ Optimize performance

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

## React Concepts You'll Learn

| Concept | Where You See It | Easy Example |
|---------|------------------|--------------|
| **Components** | `App.jsx` | Building blocks |
| **Props** | `Component.propTypes` | Passing data |
| **State** | `useState()` | Managing data |
| **Hooks** | `useEffect()` | Side effects |
| **JSX** | HTML-like syntax | UI structure |
| **Events** | `onClick` | User interactions |

---

## 📚 **Helpful Resources**

### **Beginner Java:**
- [Java Tutorials](https://docs.oracle.com/javase/tutorial/)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [REST API Guide](https://restfulapi.net/)

### **Beginner React:**
- [React Tutorial](https://react.dev/learn)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### **Tools:**
- [Postman](https://postman.com) - API testing GUI
- [IntelliJ IDEA](https://jetbrains.com/idea/) - Java IDE (Community free)
- [Visual Studio Code](https://code.visualstudio.com/) - Code editor

### **Community:**
- Stack Overflow
- Reddit r/java
- Reddit r/reactjs
- Spring Boot Discord
- Reactiflux Discord

---

## 🚨 **Emergency Help**

### **"I can't install Java!"**
- Download from: https://adoptium.net/
- Choose "JDK 21.x.x" for your OS
- Add to system PATH

### **"Maven commands don't work!"**
- Run `mvn -version` to check installation
- On Windows: Add to PATH in environment variables
- On macOS: `brew install maven`

### **"Node.js commands don't work!"**
- Run `node --version` to check installation
- On Windows: Add to PATH in environment variables
- On macOS: `brew install node`

### **"Server won't start!"**
```bash
# Check for errors
mvn spring-boot:run -Dspring.profiles.active=dev

# Common fixes:
# 1. Check port 8080 is free
# 2. Verify Java 21 is installed
# 3. Try clean build: mvn clean install
```

### **"Frontend won't start!"**
```bash
# Check for errors
cd frontend
npm run dev

# Common fixes:
# 1. Check port 5173 is free
# 2. Verify Node.js is installed
# 3. Try clean install: npm install
```

---

## ✅ **Success Checklist**

- ✅ Java 21 installed (`java -version` shows 21)
- ✅ Maven working (`mvn -version` works)
- ✅ Node.js installed (`node --version` works)
- ✅ Project cloned (`cd writegy/backend`)
- ✅ App builds (`mvn clean install` succeeds)
- ✅ Backend server starts (`mvn spring-boot:run` works)
- ✅ Frontend starts (`npm run dev` works)
- ✅ API responds (`curl localhost:8080/api/documents` works)
- ✅ Can create documents (POST request works)
- ✅ Can test dual-mode editor (GET /api/editor/modes)
- ✅ Can test grammar checking (POST /api/grammar/check)
- ✅ Can test document hierarchy (GET /api/documents/1/children)
- ✅ Can test accessibility features
- ✅ Can test complete user journey

**🎉 Check them all off? You're officially a full-stack developer!**

---

**Next step:** [Head to API-REFERENCE.md](API-REFERENCE.md) to learn all the API endpoints you can test.

**Stuck?** Ask for help - this guide is for complete beginners! 🚀
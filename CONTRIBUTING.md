# Contributing to Writegy

Thank you for your interest in contributing to Writegy! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 14+ (or use Supabase)
- Maven 3.8+
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/writegy.git
   cd writegy
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   mvn clean install
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API endpoints
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

## 📋 Branch Naming Convention

Use the following format for branch names:
```
<type>/<short-description>
```

**Types:**
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

**Examples:**
- `feat/document-export`
- `fix/grammar-api-auth`
- `docs/api-reference`
- `refactor/user-service`

## 🔧 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes
- Write clean, well-documented code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes
```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test

# Integration tests
mvn verify -Pintegration-tests
```

### 4. Commit Your Changes
Use conventional commit messages:
```bash
git commit -m "feat: Add document export functionality"
git commit -m "fix: Resolve grammar API authentication issue"
git commit -m "docs: Update API reference"
```

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 5. Push and Create Pull Request
```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Detailed description of what was implemented
- Screenshots for UI changes
- References to related issues

## 📝 Code Style Guidelines

### Java (Backend)
- Follow Google Java Style Guide
- Use meaningful variable and method names
- Add JavaDoc comments for public methods
- Keep methods focused and small
- Use dependency injection

### JavaScript/React (Frontend)
- Use functional components with hooks
- Follow ESLint configuration
- Use TypeScript for type safety (if applicable)
- Keep components small and reusable
- Use proper prop validation

### API Design
- Follow RESTful conventions
- Use consistent error handling
- Document all endpoints in Swagger
- Include proper HTTP status codes
- Validate input data

## 🧪 Testing Guidelines

### Unit Tests
- Test individual components/functions
- Mock external dependencies
- Aim for 80%+ code coverage
- Use descriptive test names

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Clean up test data

### Example Test Structure
```java
@Test
void shouldExportDocumentToPdf() {
    // Given
    Document doc = createTestDocument();
    
    // When
    byte[] pdf = exportService.generatePdf(doc);
    
    // Then
    assertNotNull(pdf);
    assertTrue(pdf.length > 0);
}
```

## 🐛 Reporting Issues

When reporting issues, include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Java version, Node version)
- Screenshots or error logs

## 🔒 Security

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Follow OWASP security guidelines
- Report security vulnerabilities privately

## 📚 Documentation

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying configuration options
- Fixing significant bugs

**Documentation locations:**
- `docs/` - Project documentation
- `README.md` - Project overview
- `docs/API-REFERENCE.md` - API documentation
- Code comments - Inline documentation

## 🎯 Pull Request Checklist

Before submitting a PR, ensure:
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No merge conflicts
- [ ] PR description is clear
- [ ] Screenshots for UI changes
- [ ] Related issues are linked

## 🤝 Code Review Process

1. All PRs require at least one review
2. Reviewers will check for:
   - Code quality and style
   - Test coverage
   - Documentation completeness
   - Security considerations
3. Address review comments promptly
4. Maintain a respectful and collaborative tone

## 📞 Getting Help

- Open an issue for bugs or feature requests
- Join our Discord community (if available)
- Check existing documentation
- Review similar PRs for examples

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Writegy! 🚀
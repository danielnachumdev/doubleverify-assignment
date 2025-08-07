# DoubleVerify Assignment - ATM System API

A robust REST API for ATM operations including balance inquiry, withdrawal, and deposit functionality. Built with Node.js, TypeScript, and Express.js.

## 🚀 Live Demo

**Deployed Application**: [DoubleVerify ATM System API](http://51.20.133.7:3000)

**Health Check**: [Health Endpoint](http://51.20.133.7:3000/health)

**Source Code**: [GitHub Repository](https://github.com/danielnachumdev/doubleverify-assignment)

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Challenges & Solutions](#challenges--solutions)
- [Contributing](#contributing)

## 🎯 System Overview

The ATM System API provides a complete banking interface with the following core operations:

- **Balance Inquiry**: Check account balance by account number
- **Withdrawal**: Withdraw funds from an account with validation
- **Deposit**: Deposit funds into an account with validation

The system is designed with security, reliability, and scalability in mind, featuring comprehensive error handling, input validation, and extensive testing.

## 🏗️ Architecture & Design Decisions

### Core Design Principles

1. **Separation of Concerns**: Clear separation between models, services, and routes
2. **Type Safety**: Full TypeScript implementation for better code quality
3. **Error Handling**: Centralized error handling with consistent response formats
4. **Validation**: Comprehensive input validation at multiple layers
5. **Testing**: Extensive test coverage with unit, integration, and e2e tests

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │    │   Middleware    │    │   Services      │
│                 │    │                 │    │                 │
│ • Balance       │───▶│ • Validation    │───▶│ • AccountService│
│ • Withdrawal    │    │ • Error Handling│    │ • DataStore     │
│ • Deposit       │    │ • CORS          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Data Layer    │
                       │                 │
                       │ • In-Memory     │
                       │ • Account Model │
                       └─────────────────┘
```

### Key Design Decisions

1. **In-Memory Storage**: Chose in-memory storage for simplicity and performance during development
2. **RESTful API Design**: Followed REST conventions for clear, predictable endpoints
3. **Comprehensive Validation**: Multiple validation layers (middleware, service, model)
4. **Error-First Design**: All operations handle errors gracefully with meaningful messages
5. **Health Monitoring**: Built-in health check endpoint for deployment monitoring

## 📚 API Documentation

### Base URL
```
# Local Development
http://localhost:3000

# Production (Deployed)
http://51.20.133.7:3000
```

**Note**: The application runs on HTTP, not HTTPS. Make sure to use `http://` in your requests.

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### 2. Balance Inquiry
```http
GET /accounts/{account_number}/balance
```

**Parameters:**
- `account_number` (string): The account number to check

**Response (Success):**
```json
{
  "account_number": "123456789",
  "balance": 1000.00
}
```

**Response (Error):**
```json
{
  "error": "Account not found",
  "status": 404
}
```

#### 3. Withdrawal
```http
POST /accounts/{account_number}/withdraw
Content-Type: application/json
```

**Parameters:**
- `account_number` (string): The account number to withdraw from
- `amount` (number): Amount to withdraw

**Request Body:**
```json
{
  "amount": 100.00
}
```

**Response (Success):**
```json
{
  "account_number": "123456789",
  "withdrawn_amount": 100.00,
  "new_balance": 900.00
}
```

**Response (Error):**
```json
{
  "error": "Insufficient funds",
  "status": 400
}
```

#### 4. Deposit
```http
POST /accounts/{account_number}/deposit
Content-Type: application/json
```

**Parameters:**
- `account_number` (string): The account number to deposit to
- `amount` (number): Amount to deposit

**Request Body:**
```json
{
  "amount": 500.00
}
```

**Response (Success):**
```json
{
  "account_number": "123456789",
  "deposited_amount": 500.00,
  "new_balance": 1400.00
}
```

**Response (Error):**
```json
{
  "error": "Invalid amount. Amount must be positive",
  "status": 400
}
```

### Error Codes

| Code | Description                 |
| ---- | --------------------------- |
| 200  | Success                     |
| 400  | Bad Request (invalid input) |
| 404  | Account Not Found           |
| 500  | Internal Server Error       |

## ✨ Features

### Core Features
- ✅ Balance inquiry by account number
- ✅ Secure withdrawal with balance validation
- ✅ Deposit functionality with amount validation
- ✅ Comprehensive error handling
- ✅ Input validation and sanitization
- ✅ Health check endpoint for monitoring

### Technical Features
- ✅ Full TypeScript implementation
- ✅ Comprehensive test suite (90%+ coverage)
- ✅ RESTful API design
- ✅ CORS support for web applications
- ✅ Environment-based configuration
- ✅ Docker containerization
- ✅ Production-ready deployment setup

### Security Features
- ✅ Input validation and sanitization
- ✅ Error message sanitization
- ✅ CORS configuration
- ✅ Non-root Docker container
- ✅ Health check monitoring

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Testing**: Jest + Supertest
- **Containerization**: Docker

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint (configurable)
- **Code Coverage**: Jest Coverage
- **Process Management**: nodemon (development)

### Deployment
- **Container**: Docker + Docker Compose
- **Platform**: AWS EC2, Heroku, or any cloud platform

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm 8+
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/danielnachumdev/doubleverify-assignment.git
cd doubleverify-assignment
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Docker Setup

1. **Build and run with Docker**
```bash
docker-compose up --build
```

2. **Or build and run manually**
```bash
docker build -t atm-system .
docker run -p 3000:3000 atm-system
```

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:watch        # Start with auto-reload

# Building
npm run build            # Build TypeScript to JavaScript

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only

# Deployment
npm run deploy:docker    # Deploy with Docker
npm start                # Start production server
```

### Project Structure

```
doubleverify-assignment/
├── src/
│   ├── models/          # Data models and interfaces
│   ├── services/        # Business logic
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   └── server.ts        # Main application entry point
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── Dockerfile         # Docker configuration
```

## 🧪 Testing

### Test Coverage
The project maintains **90%+ test coverage** across all components:

- **Unit Tests**: Individual function and class testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete workflow testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
```

### Test Examples

```typescript
// Example unit test
describe('AccountService', () => {
  it('should return account balance', () => {
    const balance = accountService.getBalance('123456789');
    expect(balance).toBe(1000.00);
  });
});
```

## 🚀 Deployment

### ✅ Current Deployment Status

**Production Environment**: ✅ **LIVE**
- **URL**: http://51.20.133.7:3000
- **Health Check**: http://51.20.133.7:3000/health
- **Status**: Deployed and Running
- **Platform**: AWS EC2 with Docker
- **Last Tested**: ✅ Working (HTTP access confirmed)

### Docker Deployment

1. **Build and deploy**
```bash
docker-compose up --build -d
```

2. **Check status**
```bash
docker-compose ps
```

3. **View logs**
```bash
docker-compose logs -f
```

### Cloud Deployment

The application is configured for deployment on various cloud platforms:

- **AWS EC2**: See `docs/EC2_DEPLOYMENT.md`
- **Docker**: Ready for any container platform

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
API_VERSION=1.0.0
CORS_ORIGIN=*
LOG_LEVEL=info
HEALTH_CHECK_PATH=/health
```

## 🎯 Challenges & Solutions

### Challenge 1: Type Safety in Dynamic Operations
**Problem**: Ensuring type safety when handling dynamic account operations
**Solution**: Implemented comprehensive TypeScript interfaces and validation functions

### Challenge 2: Error Handling Consistency
**Problem**: Maintaining consistent error responses across all endpoints
**Solution**: Created centralized error handling middleware with standardized response format

### Challenge 3: Test Coverage Requirements
**Problem**: Achieving 90%+ test coverage while maintaining code quality
**Solution**: Implemented comprehensive test strategy with unit, integration, and e2e tests

### Challenge 4: Deployment Configuration
**Problem**: Creating production-ready deployment setup
**Solution**: Implemented Docker containerization with proper security and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Built with ❤️ using Node.js, TypeScript, and Express.js** 
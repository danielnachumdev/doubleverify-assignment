# ATM System Design Document

## Overview

The ATM system is a RESTful web service that provides basic banking operations through HTTP endpoints. The system follows a layered architecture with clear separation of concerns, using in-memory storage for simplicity and fast access. The application will be built using Node.js with Express.js framework for robust HTTP handling and will be deployed to a cloud platform for accessibility.

## Architecture

The system follows a three-layer architecture:

```
┌─────────────────────────────────────┐
│           API Layer                 │
│  (Express.js Routes & Middleware)   │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│         Service Layer               │
│    (Business Logic & Validation)    │
└─────────────────────────────────────┘
                    │
┌─────────────────────────────────────┐
│        Data Layer                   │
│     (In-Memory Storage)             │
└─────────────────────────────────────┘
```

### Key Architectural Decisions:

1. **RESTful Design**: Following REST principles for predictable and standard API interactions
2. **In-Memory Storage**: Using JavaScript objects/Maps for fast data access without database complexity
3. **Stateless Service**: Each request contains all necessary information, enabling horizontal scaling
4. **JSON Communication**: Using JSON for request/response bodies for easy integration

## Components and Interfaces

### 1. Account Model
```typescript
interface Account {
  account_number: string;
  balance: number;
}
```

### 2. API Endpoints

#### GET /accounts/{account_number}/balance
- **Purpose**: Retrieve account balance
- **Response**: `{ account_number: string, balance: number }`
- **Status Codes**: 200 (success), 404 (account not found)

#### POST /accounts/{account_number}/withdraw
- **Purpose**: Withdraw money from account
- **Request Body**: `{ amount: number }`
- **Response**: `{ account_number: string, balance: number, transaction: "withdrawal", amount: number }`
- **Status Codes**: 200 (success), 400 (insufficient funds/invalid amount), 404 (account not found)

#### POST /accounts/{account_number}/deposit
- **Purpose**: Deposit money to account
- **Request Body**: `{ amount: number }`
- **Response**: `{ account_number: string, balance: number, transaction: "deposit", amount: number }`
- **Status Codes**: 200 (success), 400 (invalid amount), 404 (account not found)

### 3. Service Components

#### AccountService
- **Responsibilities**: Business logic for account operations
- **Methods**:
  - `getBalance(accountNumber: string): Account | null`
  - `withdraw(accountNumber: string, amount: number): Account | Error`
  - `deposit(accountNumber: string, amount: number): Account | Error`
  - `validateAmount(amount: number): boolean`

#### DataStore
- **Responsibilities**: In-memory data management
- **Methods**:
  - `getAccount(accountNumber: string): Account | null`
  - `updateAccount(account: Account): void`
  - `initializeAccounts(): void`

### 4. Middleware Components

#### ValidationMiddleware
- **Purpose**: Validate request parameters and body
- **Functions**: Parameter validation, amount validation, request body parsing

#### ErrorHandlingMiddleware
- **Purpose**: Centralized error handling and response formatting
- **Functions**: Error logging, consistent error response format

## Data Models

### Account Storage Structure
```javascript
// In-memory storage using Map for O(1) lookups
const accounts = new Map([
  ['123456789', { account_number: '123456789', balance: 1000.00 }],
  ['987654321', { account_number: '987654321', balance: 2500.50 }],
  ['555666777', { account_number: '555666777', balance: 100.25 }]
]);
```

### Request/Response Models

#### Balance Response
```json
{
  "account_number": "123456789",
  "balance": 1000.00
}
```

#### Transaction Request
```json
{
  "amount": 250.00
}
```

#### Transaction Response
```json
{
  "account_number": "123456789",
  "balance": 750.00,
  "transaction": "withdrawal",
  "amount": 250.00
}
```

#### Error Response
```json
{
  "error": "Insufficient funds",
  "code": "INSUFFICIENT_FUNDS",
  "account_number": "123456789"
}
```

## Error Handling

### Error Categories and Responses

1. **Account Not Found (404)**
   - Message: "Account not found"
   - Code: "ACCOUNT_NOT_FOUND"

2. **Insufficient Funds (400)**
   - Message: "Insufficient funds for withdrawal"
   - Code: "INSUFFICIENT_FUNDS"

3. **Invalid Amount (400)**
   - Message: "Amount must be greater than zero"
   - Code: "INVALID_AMOUNT"

4. **Invalid Request Format (400)**
   - Message: "Invalid request format"
   - Code: "INVALID_REQUEST"

5. **Server Error (500)**
   - Message: "Internal server error"
   - Code: "INTERNAL_ERROR"

### Error Handling Strategy
- All errors return consistent JSON format with error message, code, and relevant context
- Input validation occurs at middleware level before reaching business logic
- Business logic errors are caught and transformed into appropriate HTTP responses
- Logging implemented for debugging and monitoring

## Testing Strategy

### Unit Testing
- **Account Service Tests**: Test business logic for all operations
- **Data Store Tests**: Test in-memory storage operations
- **Validation Tests**: Test input validation functions
- **Error Handling Tests**: Test error scenarios and responses

### Integration Testing
- **API Endpoint Tests**: Test complete request/response cycles
- **Error Flow Tests**: Test error handling through full stack
- **Data Persistence Tests**: Test in-memory storage consistency

### Test Scenarios
1. **Happy Path Tests**:
   - Successful balance retrieval
   - Successful withdrawal with sufficient funds
   - Successful deposit

2. **Error Path Tests**:
   - Balance check for non-existent account
   - Withdrawal with insufficient funds
   - Withdrawal/deposit with invalid amounts
   - Withdrawal/deposit for non-existent account

3. **Edge Case Tests**:
   - Zero amount transactions
   - Negative amount transactions
   - Very large amount transactions
   - Concurrent transaction handling

### Testing Tools
- **Jest**: Unit and integration testing framework
- **Supertest**: HTTP endpoint testing
- **Coverage**: Code coverage reporting to ensure comprehensive testing

## Deployment Architecture

### Cloud Platform Options
- **Primary Choice**: Heroku (simple deployment, good for demos)
- **Alternative**: Railway, Render, or AWS Lambda

### Deployment Configuration
```javascript
// Environment configuration
const config = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
};
```

### Deployment Requirements
- Node.js runtime environment
- Environment variable configuration
- Health check endpoint for monitoring
- CORS configuration for web access
- Process management for reliability
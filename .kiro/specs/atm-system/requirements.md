# Requirements Document

## Introduction

This document outlines the requirements for a simple ATM system with server-side components. The system will provide a REST API that allows users to perform basic banking operations including balance inquiries, withdrawals, and deposits. The system will use in-memory storage for account data and will be deployed to a cloud platform for accessibility.

## Requirements

### Requirement 1

**User Story:** As a bank customer, I want to check my account balance, so that I can know how much money I have available.

#### Acceptance Criteria

1. WHEN a GET request is made to /accounts/{account_number}/balance THEN the system SHALL return the current balance for the specified account
2. IF the account number exists THEN the system SHALL return a 200 status code with the balance amount
3. IF the account number does not exist THEN the system SHALL return a 404 status code with an appropriate error message
4. WHEN the balance is returned THEN it SHALL be formatted as a numeric value with appropriate precision for currency

### Requirement 2

**User Story:** As a bank customer, I want to withdraw money from my account, so that I can access my funds when needed.

#### Acceptance Criteria

1. WHEN a POST request is made to /accounts/{account_number}/withdraw with an amount THEN the system SHALL deduct the specified amount from the account balance
2. IF the withdrawal amount is greater than the current balance THEN the system SHALL return a 400 status code with an insufficient funds error message
3. IF the withdrawal amount is less than or equal to zero THEN the system SHALL return a 400 status code with an invalid amount error message
4. IF the account number does not exist THEN the system SHALL return a 404 status code with an appropriate error message
5. WHEN a successful withdrawal occurs THEN the system SHALL return a 200 status code with the updated balance
6. WHEN a withdrawal is processed THEN the account balance SHALL be updated immediately in the system

### Requirement 3

**User Story:** As a bank customer, I want to deposit money into my account, so that I can add funds to my available balance.

#### Acceptance Criteria

1. WHEN a POST request is made to /accounts/{account_number}/deposit with an amount THEN the system SHALL add the specified amount to the account balance
2. IF the deposit amount is less than or equal to zero THEN the system SHALL return a 400 status code with an invalid amount error message
3. IF the account number does not exist THEN the system SHALL return a 404 status code with an appropriate error message
4. WHEN a successful deposit occurs THEN the system SHALL return a 200 status code with the updated balance
5. WHEN a deposit is processed THEN the account balance SHALL be updated immediately in the system

### Requirement 4

**User Story:** As a system administrator, I want accounts to have unique identifiers and balance tracking, so that the system can manage multiple customer accounts securely.

#### Acceptance Criteria

1. WHEN an account is created THEN it SHALL have a unique account_number identifier
2. WHEN an account is created THEN it SHALL have a balance attribute that tracks the current funds
3. WHEN the system starts THEN it SHALL initialize with at least one test account for demonstration purposes
4. WHEN account data is stored THEN it SHALL be maintained in-memory during the application runtime

### Requirement 5

**User Story:** As a developer or tester, I want to access the ATM system via a deployed cloud service, so that I can test the functionality without local setup.

#### Acceptance Criteria

1. WHEN the server application is deployed THEN it SHALL be accessible via a public URL on a cloud platform
2. WHEN the deployment is complete THEN the system SHALL provide the hosted URL for API access
3. WHEN API calls are made to the deployed service THEN they SHALL function identically to local development
4. WHEN the service is deployed THEN it SHALL maintain uptime and availability for testing purposes

### Requirement 6

**User Story:** As a developer, I want comprehensive documentation and setup instructions, so that I can understand the system design and execute API calls effectively.

#### Acceptance Criteria

1. WHEN the project is delivered THEN it SHALL include a README file with detailed explanation of the approach and design decisions
2. WHEN documentation is provided THEN it SHALL include clear instructions on how to execute API calls
3. WHEN the project is submitted THEN it SHALL include a Git repository link with all code and documentation
4. WHEN challenges are encountered during development THEN they SHALL be documented in the README for reference
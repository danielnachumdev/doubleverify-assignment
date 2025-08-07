import { Account, AccountValidator } from '../models/Account';
import { DataStore } from './DataStore';

/**
 * Custom error types for account operations
 */
export class AccountNotFoundError extends Error {
  constructor(accountNumber: string) {
    super(`Account ${accountNumber} not found`);
    this.name = 'AccountNotFoundError';
  }
}

export class InsufficientFundsError extends Error {
  constructor(accountNumber: string, requestedAmount: number, availableBalance: number) {
    super(`Insufficient funds for withdrawal. Account: ${accountNumber}, Requested: ${requestedAmount}, Available: ${availableBalance}`);
    this.name = 'InsufficientFundsError';
  }
}

export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAmountError';
  }
}

/**
 * Service class for handling account business logic operations
 */
export class AccountService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  /**
   * Retrieve the balance for a specific account
   * @param accountNumber - The account number to get balance for
   * @returns Account object with current balance
   * @throws AccountNotFoundError if account doesn't exist
   */
  public getBalance(accountNumber: string): Account {
    // Validate input
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new Error('Account number must be a non-empty string');
    }

    const trimmedAccountNumber = accountNumber.trim();
    
    // Validate account number format
    if (!AccountValidator.isValidAccountNumber(trimmedAccountNumber)) {
      throw new Error('Invalid account number format');
    }

    // Retrieve account from data store
    const account = this.dataStore.getAccount(trimmedAccountNumber);
    
    if (!account) {
      throw new AccountNotFoundError(trimmedAccountNumber);
    }

    return {
      account_number: account.account_number,
      balance: account.balance
    };
  }

  /**
   * Withdraw money from an account
   * @param accountNumber - The account number to withdraw from
   * @param amount - The amount to withdraw
   * @returns Updated account object after withdrawal
   * @throws AccountNotFoundError if account doesn't exist
   * @throws InvalidAmountError if amount is invalid
   * @throws InsufficientFundsError if insufficient funds
   */
  public withdraw(accountNumber: string, amount: number): Account {
    // Validate inputs
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new Error('Account number must be a non-empty string');
    }

    if (typeof amount !== 'number') {
      throw new InvalidAmountError('Amount must be a number');
    }

    const trimmedAccountNumber = accountNumber.trim();
    
    // Validate account number format
    if (!AccountValidator.isValidAccountNumber(trimmedAccountNumber)) {
      throw new Error('Invalid account number format');
    }

    // Validate amount
    if (!AccountValidator.isValidAmount(amount)) {
      throw new InvalidAmountError('Amount must be greater than zero');
    }

    // Get current account
    const account = this.dataStore.getAccount(trimmedAccountNumber);
    
    if (!account) {
      throw new AccountNotFoundError(trimmedAccountNumber);
    }

    // Check for sufficient funds
    if (account.balance < amount) {
      throw new InsufficientFundsError(trimmedAccountNumber, amount, account.balance);
    }

    // Calculate new balance
    const newBalance = AccountValidator.formatBalance(account.balance - amount);

    // Update account
    const updatedAccount: Account = {
      account_number: account.account_number,
      balance: newBalance
    };

    this.dataStore.updateAccount(updatedAccount);

    return updatedAccount;
  }

  /**
   * Deposit money into an account
   * @param accountNumber - The account number to deposit to
   * @param amount - The amount to deposit
   * @returns Updated account object after deposit
   * @throws AccountNotFoundError if account doesn't exist
   * @throws InvalidAmountError if amount is invalid
   */
  public deposit(accountNumber: string, amount: number): Account {
    // Validate inputs
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new Error('Account number must be a non-empty string');
    }

    if (typeof amount !== 'number') {
      throw new InvalidAmountError('Amount must be a number');
    }

    const trimmedAccountNumber = accountNumber.trim();
    
    // Validate account number format
    if (!AccountValidator.isValidAccountNumber(trimmedAccountNumber)) {
      throw new Error('Invalid account number format');
    }

    // Validate amount
    if (!AccountValidator.isValidAmount(amount)) {
      throw new InvalidAmountError('Amount must be greater than zero');
    }

    // Get current account
    const account = this.dataStore.getAccount(trimmedAccountNumber);
    
    if (!account) {
      throw new AccountNotFoundError(trimmedAccountNumber);
    }

    // Calculate new balance
    const newBalance = AccountValidator.formatBalance(account.balance + amount);

    // Update account
    const updatedAccount: Account = {
      account_number: account.account_number,
      balance: newBalance
    };

    this.dataStore.updateAccount(updatedAccount);

    return updatedAccount;
  }

  /**
   * Validate if an amount is valid for transactions
   * @param amount - The amount to validate
   * @returns true if valid, false otherwise
   */
  public validateAmount(amount: number): boolean {
    return AccountValidator.isValidAmount(amount);
  }

  /**
   * Check if an account exists
   * @param accountNumber - The account number to check
   * @returns true if account exists, false otherwise
   */
  public accountExists(accountNumber: string): boolean {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return false;
    }

    const trimmedAccountNumber = accountNumber.trim();
    
    // Validate account number format
    if (!AccountValidator.isValidAccountNumber(trimmedAccountNumber)) {
      return false;
    }

    return this.dataStore.accountExists(trimmedAccountNumber);
  }

  /**
   * Get all accounts (for testing/admin purposes)
   * @returns Array of all accounts
   */
  public getAllAccounts(): Account[] {
    return this.dataStore.getAllAccounts();
  }
}
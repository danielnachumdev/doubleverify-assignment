import { Account, AccountValidator } from '../models/Account';

/**
 * In-memory data store for managing account data
 * Uses TypeScript Map for O(1) lookup performance
 */
export class DataStore {
  private static instance: DataStore;
  private accounts: Map<string, Account>;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.accounts = new Map<string, Account>();
    this.initializeAccounts();
  }

  /**
   * Get the singleton instance of DataStore
   * @returns DataStore instance
   */
  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  /**
   * Initialize the data store with test accounts for demonstration
   */
  public initializeAccounts(): void {
    const testAccounts: Array<{ account_number: string; balance: number }> = [
      { account_number: '123456789', balance: 1000.00 },
      { account_number: '987654321', balance: 2500.50 },
      { account_number: '555666777', balance: 100.25 },
      { account_number: '111222333', balance: 5000.00 },
      { account_number: '999888777', balance: 750.75 }
    ];

    // Clear existing accounts
    this.accounts.clear();

    // Add test accounts with validation
    testAccounts.forEach(({ account_number, balance }) => {
      try {
        const account = AccountValidator.createAccount(account_number, balance);
        this.accounts.set(account_number, account);
      } catch (error) {
        console.error(`Failed to initialize account ${account_number}:`, error);
      }
    });

    console.log(`Initialized ${this.accounts.size} test accounts`);
  }

  /**
   * Retrieve an account by account number
   * @param accountNumber - The account number to search for
   * @returns Account object if found, null otherwise
   */
  public getAccount(accountNumber: string): Account | null {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return null;
    }

    const trimmedAccountNumber = accountNumber.trim();
    return this.accounts.get(trimmedAccountNumber) || null;
  }

  /**
   * Update an existing account in the data store
   * @param account - The account object to update
   * @throws Error if account validation fails
   */
  public updateAccount(account: Account): void {
    // Validate the account before updating
    const validation = AccountValidator.validateAccount(account);
    if (!validation.isValid) {
      throw new Error(`Cannot update account: ${validation.errors.join(', ')}`);
    }

    // Ensure the account exists before updating
    if (!this.accounts.has(account.account_number)) {
      throw new Error(`Account ${account.account_number} does not exist`);
    }

    // Update the account with formatted balance
    const updatedAccount: Account = {
      account_number: account.account_number,
      balance: AccountValidator.formatBalance(account.balance)
    };

    this.accounts.set(account.account_number, updatedAccount);
  }

  /**
   * Create a new account in the data store
   * @param accountNumber - The account number
   * @param initialBalance - The initial balance
   * @returns The created account
   * @throws Error if account already exists or validation fails
   */
  public createAccount(accountNumber: string, initialBalance: number): Account {
    const trimmedAccountNumber = accountNumber.trim();

    // Check if account already exists
    if (this.accounts.has(trimmedAccountNumber)) {
      throw new Error(`Account ${trimmedAccountNumber} already exists`);
    }

    // Create and validate the account
    const account = AccountValidator.createAccount(trimmedAccountNumber, initialBalance);

    // Store the account
    this.accounts.set(trimmedAccountNumber, account);

    return account;
  }

  /**
   * Delete an account from the data store
   * @param accountNumber - The account number to delete
   * @returns true if account was deleted, false if not found
   */
  public deleteAccount(accountNumber: string): boolean {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return false;
    }

    const trimmedAccountNumber = accountNumber.trim();
    return this.accounts.delete(trimmedAccountNumber);
  }

  /**
   * Get all accounts (for testing/debugging purposes)
   * @returns Array of all accounts
   */
  public getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get the total number of accounts
   * @returns Number of accounts in the store
   */
  public getAccountCount(): number {
    return this.accounts.size;
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
    return this.accounts.has(trimmedAccountNumber);
  }

  /**
   * Clear all accounts (for testing purposes)
   */
  public clearAllAccounts(): void {
    this.accounts.clear();
  }

  /**
   * Reset the data store to initial state
   */
  public reset(): void {
    this.clearAllAccounts();
    this.initializeAccounts();
  }
}
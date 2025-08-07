import { DataStore } from '../../src/services/DataStore';

/**
 * Test helper utilities for ATM system tests
 */
export class TestHelpers {
  /**
   * Sets up a fresh DataStore instance for testing
   * @returns DataStore instance
   */
  static setupDataStore(): DataStore {
    const dataStore = DataStore.getInstance();
    dataStore.reset();
    return dataStore;
  }

  /**
   * Cleans up DataStore after tests
   * @param dataStore - DataStore instance to clean up
   */
  static cleanupDataStore(dataStore: DataStore): void {
    dataStore.clearAllAccounts();
  }

  /**
   * Mocks console.error to avoid cluttering test output
   * @returns Spy function for console.error
   */
  static mockConsoleError(): jest.SpyInstance {
    return jest.spyOn(console, 'error').mockImplementation(() => {});
  }

  /**
   * Restores console.error after mocking
   * @param spy - The console.error spy to restore
   */
  static restoreConsoleError(spy: jest.SpyInstance): void {
    spy.mockRestore();
  }

  /**
   * Creates a mock for DataStore.getAccount that throws an error
   * @param dataStore - DataStore instance to mock
   * @param error - Error to throw
   * @returns Original getAccount method for restoration
   */
  static mockDataStoreError(dataStore: DataStore, error: Error): Function {
    const originalGetAccount = dataStore.getAccount;
    dataStore.getAccount = jest.fn().mockImplementation(() => {
      throw error;
    });
    return originalGetAccount;
  }

  /**
   * Restores DataStore.getAccount method after mocking
   * @param dataStore - DataStore instance
   * @param originalMethod - Original method to restore
   */
  static restoreDataStoreMethod(dataStore: DataStore, originalMethod: Function): void {
    dataStore.getAccount = originalMethod as any;
  }

  /**
   * Common test account numbers for consistent testing
   */
  static readonly TEST_ACCOUNTS = {
    VALID_ACCOUNT_1: '123456789',
    VALID_ACCOUNT_2: '987654321', 
    VALID_ACCOUNT_3: '555666777',
    VALID_ACCOUNT_4: '111222333',
    VALID_ACCOUNT_5: '999888777',
    NON_EXISTENT: '999999999',
    INVALID_SHORT: '12345',
    INVALID_LONG: '1234567890123',
    INVALID_FORMAT: 'invalid'
  };

  /**
   * Expected balances for test accounts
   */
  static readonly EXPECTED_BALANCES = {
    [TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1]: 1000.00,
    [TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2]: 2500.50,
    [TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3]: 100.25,
    [TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4]: 5000.00,
    [TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_5]: 750.75
  };

  /**
   * Common error response matchers
   */
  static readonly ERROR_MATCHERS = {
    ACCOUNT_NOT_FOUND: (accountNumber: string) => ({
      error: `Account ${accountNumber} not found`,
      code: 'ACCOUNT_NOT_FOUND',
      timestamp: expect.any(String),
      path: expect.any(String),
      method: expect.any(String)
    }),
    
    INVALID_ACCOUNT_NUMBER: (provided: string) => ({
      error: 'Invalid account number format. Account number must be 6-12 digits.',
      code: 'INVALID_ACCOUNT_NUMBER',
      provided
    }),
    
    INSUFFICIENT_FUNDS: {
      code: 'INSUFFICIENT_FUNDS',
      timestamp: expect.any(String),
      path: expect.any(String),
      method: expect.any(String)
    },
    
    INVALID_AMOUNT: {
      code: 'INVALID_AMOUNT',
      timestamp: expect.any(String),
      path: expect.any(String),
      method: expect.any(String)
    },
    
    ROUTE_NOT_FOUND: (method: string, path: string) => ({
      error: `Route ${method} ${path} not found`,
      code: 'NOT_FOUND',
      timestamp: expect.any(String),
      path,
      method
    })
  };

  /**
   * Creates a successful balance response matcher
   */
  static balanceResponse(accountNumber: string, balance: number) {
    return {
      account_number: accountNumber,
      balance
    };
  }

  /**
   * Gets expected balance for a test account
   */
  static getExpectedBalance(accountNumber: string): number {
    const balance = TestHelpers.EXPECTED_BALANCES[accountNumber];
    if (balance === undefined) {
      throw new Error(`No expected balance defined for account ${accountNumber}`);
    }
    return balance;
  }

  /**
   * Creates a successful transaction response matcher
   */
  static transactionResponse(accountNumber: string, balance: number, transaction: string, amount: number) {
    return {
      account_number: accountNumber,
      balance,
      transaction,
      amount
    };
  }

  /**
   * Waits for a specified amount of time (useful for async tests)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates a random valid account number for testing
   */
  static generateRandomAccountNumber(): string {
    const length = Math.floor(Math.random() * 7) + 6; // 6-12 digits
    return Math.random().toString().slice(2, 2 + length).padEnd(length, '0');
  }

  /**
   * Generates a random amount for testing
   */
  static generateRandomAmount(min: number = 1, max: number = 1000): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }
}
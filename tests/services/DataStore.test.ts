import { DataStore } from '../../src/services/DataStore';
import { Account } from '../../src/models/Account';

describe('DataStore', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    // Get a fresh instance and reset it for each test
    dataStore = DataStore.getInstance();
    dataStore.reset();
  });

  afterEach(() => {
    // Clean up after each test
    dataStore.clearAllAccounts();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = DataStore.getInstance();
      const instance2 = DataStore.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initializeAccounts', () => {
    it('should initialize with test accounts', () => {
      dataStore.clearAllAccounts();
      expect(dataStore.getAccountCount()).toBe(0);

      dataStore.initializeAccounts();

      expect(dataStore.getAccountCount()).toBe(5);
      expect(dataStore.accountExists('123456789')).toBe(true);
      expect(dataStore.accountExists('987654321')).toBe(true);
      expect(dataStore.accountExists('555666777')).toBe(true);
      expect(dataStore.accountExists('111222333')).toBe(true);
      expect(dataStore.accountExists('999888777')).toBe(true);
    });

    it('should clear existing accounts before initializing', () => {
      const initialCount = dataStore.getAccountCount();
      expect(initialCount).toBeGreaterThan(0);

      dataStore.initializeAccounts();

      expect(dataStore.getAccountCount()).toBe(5);
    });

    it('should initialize accounts with correct balances', () => {
      const account1 = dataStore.getAccount('123456789');
      const account2 = dataStore.getAccount('987654321');
      const account3 = dataStore.getAccount('555666777');

      expect(account1?.balance).toBe(1000.00);
      expect(account2?.balance).toBe(2500.50);
      expect(account3?.balance).toBe(100.25);
    });
  });

  describe('getAccount', () => {
    it('should return account when it exists', () => {
      const account = dataStore.getAccount('123456789');

      expect(account).not.toBeNull();
      expect(account?.account_number).toBe('123456789');
      expect(account?.balance).toBe(1000.00);
    });

    it('should return null when account does not exist', () => {
      const account = dataStore.getAccount('999999999');

      expect(account).toBeNull();
    });

    it('should handle empty or invalid account numbers', () => {
      expect(dataStore.getAccount('')).toBeNull();
      expect(dataStore.getAccount('   ')).toBeNull();
      expect(dataStore.getAccount(null as any)).toBeNull();
      expect(dataStore.getAccount(undefined as any)).toBeNull();
      expect(dataStore.getAccount(123 as any)).toBeNull();
    });

    it('should handle account numbers with whitespace', () => {
      const account = dataStore.getAccount(' 123456789 ');

      expect(account).not.toBeNull();
      expect(account?.account_number).toBe('123456789');
    });
  });

  describe('updateAccount', () => {
    it('should update an existing account', () => {
      const originalAccount = dataStore.getAccount('123456789');
      expect(originalAccount?.balance).toBe(1000.00);

      const updatedAccount: Account = {
        account_number: '123456789',
        balance: 1500.75
      };

      dataStore.updateAccount(updatedAccount);

      const retrievedAccount = dataStore.getAccount('123456789');
      expect(retrievedAccount?.balance).toBe(1500.75);
    });

    it('should format balance when updating', () => {
      const updatedAccount: Account = {
        account_number: '123456789',
        balance: 1500.999
      };

      dataStore.updateAccount(updatedAccount);

      const retrievedAccount = dataStore.getAccount('123456789');
      expect(retrievedAccount?.balance).toBe(1501.00);
    });

    it('should throw error when updating non-existent account', () => {
      const nonExistentAccount: Account = {
        account_number: '999999999',
        balance: 1000
      };

      expect(() => {
        dataStore.updateAccount(nonExistentAccount);
      }).toThrow('Account 999999999 does not exist');
    });

    it('should throw error when updating with invalid account data', () => {
      const invalidAccount = {
        account_number: '123456789',
        balance: -100
      } as Account;

      expect(() => {
        dataStore.updateAccount(invalidAccount);
      }).toThrow('Cannot update account:');
    });
  });

  describe('createAccount', () => {
    it('should create a new account', () => {
      const newAccount = dataStore.createAccount('444555666', 2000.00);

      expect(newAccount.account_number).toBe('444555666');
      expect(newAccount.balance).toBe(2000.00);
      expect(dataStore.accountExists('444555666')).toBe(true);
    });

    it('should format balance when creating account', () => {
      const newAccount = dataStore.createAccount('444555666', 2000.999);

      expect(newAccount.balance).toBe(2001.00);
    });

    it('should trim whitespace from account number', () => {
      const newAccount = dataStore.createAccount(' 444555666 ', 2000.00);

      expect(newAccount.account_number).toBe('444555666');
      expect(dataStore.accountExists('444555666')).toBe(true);
    });

    it('should throw error when creating account that already exists', () => {
      expect(() => {
        dataStore.createAccount('123456789', 1000);
      }).toThrow('Account 123456789 already exists');
    });

    it('should throw error when creating account with invalid data', () => {
      expect(() => {
        dataStore.createAccount('invalid', 1000);
      }).toThrow('Invalid account data:');

      expect(() => {
        dataStore.createAccount('444555666', -100);
      }).toThrow('Invalid account data:');
    });
  });

  describe('deleteAccount', () => {
    it('should delete an existing account', () => {
      expect(dataStore.accountExists('123456789')).toBe(true);

      const result = dataStore.deleteAccount('123456789');

      expect(result).toBe(true);
      expect(dataStore.accountExists('123456789')).toBe(false);
    });

    it('should return false when deleting non-existent account', () => {
      const result = dataStore.deleteAccount('999999999');

      expect(result).toBe(false);
    });

    it('should handle invalid account numbers', () => {
      expect(dataStore.deleteAccount('')).toBe(false);
      expect(dataStore.deleteAccount(null as any)).toBe(false);
      expect(dataStore.deleteAccount(undefined as any)).toBe(false);
      expect(dataStore.deleteAccount(123 as any)).toBe(false);
    });

    it('should handle account numbers with whitespace', () => {
      expect(dataStore.accountExists('123456789')).toBe(true);

      const result = dataStore.deleteAccount(' 123456789 ');

      expect(result).toBe(true);
      expect(dataStore.accountExists('123456789')).toBe(false);
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts', () => {
      const accounts = dataStore.getAllAccounts();

      expect(accounts).toHaveLength(5);
      expect(accounts.every(account => account.account_number && typeof account.balance === 'number')).toBe(true);
    });

    it('should return empty array when no accounts exist', () => {
      dataStore.clearAllAccounts();
      const accounts = dataStore.getAllAccounts();

      expect(accounts).toHaveLength(0);
    });
  });

  describe('getAccountCount', () => {
    it('should return correct count of accounts', () => {
      expect(dataStore.getAccountCount()).toBe(5);

      dataStore.createAccount('444555666', 1000);
      expect(dataStore.getAccountCount()).toBe(6);

      dataStore.deleteAccount('123456789');
      expect(dataStore.getAccountCount()).toBe(5);
    });
  });

  describe('accountExists', () => {
    it('should return true for existing accounts', () => {
      expect(dataStore.accountExists('123456789')).toBe(true);
      expect(dataStore.accountExists('987654321')).toBe(true);
    });

    it('should return false for non-existing accounts', () => {
      expect(dataStore.accountExists('999999999')).toBe(false);
    });

    it('should handle invalid account numbers', () => {
      expect(dataStore.accountExists('')).toBe(false);
      expect(dataStore.accountExists(null as any)).toBe(false);
      expect(dataStore.accountExists(undefined as any)).toBe(false);
      expect(dataStore.accountExists(123 as any)).toBe(false);
    });

    it('should handle account numbers with whitespace', () => {
      expect(dataStore.accountExists(' 123456789 ')).toBe(true);
    });
  });

  describe('clearAllAccounts', () => {
    it('should remove all accounts', () => {
      expect(dataStore.getAccountCount()).toBe(5);

      dataStore.clearAllAccounts();

      expect(dataStore.getAccountCount()).toBe(0);
      expect(dataStore.getAllAccounts()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Modify the data store
      dataStore.createAccount('444555666', 1000);
      dataStore.deleteAccount('123456789');
      expect(dataStore.getAccountCount()).toBe(5);

      // Reset
      dataStore.reset();

      // Should be back to initial state
      expect(dataStore.getAccountCount()).toBe(5);
      expect(dataStore.accountExists('123456789')).toBe(true);
      expect(dataStore.accountExists('444555666')).toBe(false);
    });
  });
});
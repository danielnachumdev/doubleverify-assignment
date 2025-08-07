import { Account, AccountValidator, ValidationResult } from '../../src/models/Account';

describe('AccountValidator', () => {
  describe('validateAccount', () => {
    it('should validate a correct account object', () => {
      const account: Account = {
        account_number: '123456789',
        balance: 1000.50
      };

      const result: ValidationResult = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined account', () => {
      const result1 = AccountValidator.validateAccount(null);
      const result2 = AccountValidator.validateAccount(undefined);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Account must be an object');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Account must be an object');
    });

    it('should reject non-object account', () => {
      const result = AccountValidator.validateAccount('not an object');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account must be an object');
    });

    it('should reject account without account_number', () => {
      const account = { balance: 1000 };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account number is required');
    });

    it('should reject account with non-string account_number', () => {
      const account = { account_number: 123456789, balance: 1000 };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account number must be a string');
    });

    it('should reject account without balance', () => {
      const account = { account_number: '123456789' };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Balance is required');
    });

    it('should reject account with non-number balance', () => {
      const account = { account_number: '123456789', balance: '1000' };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Balance must be a number');
    });

    it('should reject account with invalid balance (NaN)', () => {
      const account = { account_number: '123456789', balance: NaN };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Balance must be a valid number (not NaN or Infinity)');
    });

    it('should reject account with invalid balance (Infinity)', () => {
      const account = { account_number: '123456789', balance: Infinity };

      const result = AccountValidator.validateAccount(account);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Balance must be a valid number (not NaN or Infinity)');
    });
  });

  describe('isValidAccountNumber', () => {
    it('should accept valid account numbers', () => {
      expect(AccountValidator.isValidAccountNumber('123456')).toBe(true);
      expect(AccountValidator.isValidAccountNumber('123456789')).toBe(true);
      expect(AccountValidator.isValidAccountNumber('123456789012')).toBe(true);
    });

    it('should reject account numbers that are too short', () => {
      expect(AccountValidator.isValidAccountNumber('12345')).toBe(false);
    });

    it('should reject account numbers that are too long', () => {
      expect(AccountValidator.isValidAccountNumber('1234567890123')).toBe(false);
    });

    it('should reject account numbers with non-digit characters', () => {
      expect(AccountValidator.isValidAccountNumber('12345a')).toBe(false);
      expect(AccountValidator.isValidAccountNumber('123-456')).toBe(false);
      expect(AccountValidator.isValidAccountNumber('123 456')).toBe(false);
    });

    it('should reject empty or whitespace-only account numbers', () => {
      expect(AccountValidator.isValidAccountNumber('')).toBe(false);
      expect(AccountValidator.isValidAccountNumber('   ')).toBe(false);
    });

    it('should handle account numbers with leading/trailing whitespace', () => {
      expect(AccountValidator.isValidAccountNumber(' 123456 ')).toBe(true);
    });
  });

  describe('isValidBalance', () => {
    it('should accept valid positive balances', () => {
      expect(AccountValidator.isValidBalance(0)).toBe(true);
      expect(AccountValidator.isValidBalance(100.50)).toBe(true);
      expect(AccountValidator.isValidBalance(1000000)).toBe(true);
    });

    it('should reject negative balances', () => {
      expect(AccountValidator.isValidBalance(-100)).toBe(false);
      expect(AccountValidator.isValidBalance(-0.01)).toBe(false);
    });

    it('should reject NaN and Infinity', () => {
      expect(AccountValidator.isValidBalance(NaN)).toBe(false);
      expect(AccountValidator.isValidBalance(Infinity)).toBe(false);
      expect(AccountValidator.isValidBalance(-Infinity)).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    it('should accept valid positive amounts', () => {
      expect(AccountValidator.isValidAmount(0.01)).toBe(true);
      expect(AccountValidator.isValidAmount(100.50)).toBe(true);
      expect(AccountValidator.isValidAmount(1000000)).toBe(true);
    });

    it('should reject zero and negative amounts', () => {
      expect(AccountValidator.isValidAmount(0)).toBe(false);
      expect(AccountValidator.isValidAmount(-100)).toBe(false);
      expect(AccountValidator.isValidAmount(-0.01)).toBe(false);
    });

    it('should reject NaN and Infinity', () => {
      expect(AccountValidator.isValidAmount(NaN)).toBe(false);
      expect(AccountValidator.isValidAmount(Infinity)).toBe(false);
      expect(AccountValidator.isValidAmount(-Infinity)).toBe(false);
    });
  });

  describe('formatBalance', () => {
    it('should format balance to 2 decimal places', () => {
      expect(AccountValidator.formatBalance(100.123)).toBe(100.12);
      expect(AccountValidator.formatBalance(100.126)).toBe(100.13);
      expect(AccountValidator.formatBalance(100)).toBe(100);
      expect(AccountValidator.formatBalance(100.1)).toBe(100.1);
    });

    it('should handle edge cases', () => {
      expect(AccountValidator.formatBalance(0)).toBe(0);
      expect(AccountValidator.formatBalance(0.001)).toBe(0);
      expect(AccountValidator.formatBalance(0.005)).toBe(0.01);
    });
  });

  describe('createAccount', () => {
    it('should create a valid account', () => {
      const account = AccountValidator.createAccount('123456789', 1000.123);

      expect(account.account_number).toBe('123456789');
      expect(account.balance).toBe(1000.12);
    });

    it('should trim whitespace from account number', () => {
      const account = AccountValidator.createAccount(' 123456789 ', 1000);

      expect(account.account_number).toBe('123456789');
    });

    it('should throw error for invalid account number', () => {
      expect(() => {
        AccountValidator.createAccount('invalid', 1000);
      }).toThrow('Invalid account data: Account number must be a non-empty string with valid format');
    });

    it('should throw error for invalid balance', () => {
      expect(() => {
        AccountValidator.createAccount('123456789', -100);
      }).toThrow('Invalid account data: Balance must be a valid number (not NaN or Infinity)');
    });

    it('should throw error for multiple validation errors', () => {
      expect(() => {
        AccountValidator.createAccount('', NaN);
      }).toThrow('Invalid account data:');
    });
  });
});
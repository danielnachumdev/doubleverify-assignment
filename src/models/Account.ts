/**
 * Account interface representing a bank account in the ATM system
 */
export interface Account {
  account_number: string;
  balance: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Account validation functions
 */
export class AccountValidator {
  /**
   * Validates an account object
   * @param account - The account to validate
   * @returns ValidationResult indicating if the account is valid
   */
  static validateAccount(account: unknown): ValidationResult {
    const errors: string[] = [];

    // Check if account is an object
    if (!account || typeof account !== 'object') {
      errors.push('Account must be an object');
      return { isValid: false, errors };
    }

    const acc = account as Record<string, unknown>;

    // Validate account_number
    if (!acc['account_number']) {
      errors.push('Account number is required');
    } else if (typeof acc['account_number'] !== 'string') {
      errors.push('Account number must be a string');
    } else if (!this.isValidAccountNumber(acc['account_number'] as string)) {
      errors.push('Account number must be a non-empty string with valid format');
    }

    // Validate balance
    if (acc['balance'] === undefined || acc['balance'] === null) {
      errors.push('Balance is required');
    } else if (typeof acc['balance'] !== 'number') {
      errors.push('Balance must be a number');
    } else if (!this.isValidBalance(acc['balance'] as number)) {
      errors.push('Balance must be a valid number (not NaN or Infinity)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates an account number format
   * @param accountNumber - The account number to validate
   * @returns true if valid, false otherwise
   */
  static isValidAccountNumber(accountNumber: string): boolean {
    // Account number should be non-empty string with only digits
    return /^\d{6,12}$/.test(accountNumber.trim());
  }

  /**
   * Validates a balance value
   * @param balance - The balance to validate
   * @returns true if valid, false otherwise
   */
  static isValidBalance(balance: number): boolean {
    return !isNaN(balance) && isFinite(balance) && balance >= 0;
  }

  /**
   * Validates a transaction amount
   * @param amount - The amount to validate
   * @returns true if valid, false otherwise
   */
  static isValidAmount(amount: number): boolean {
    return !isNaN(amount) && isFinite(amount) && amount > 0;
  }

  /**
   * Formats balance to 2 decimal places for currency display
   * @param balance - The balance to format
   * @returns formatted balance string
   */
  static formatBalance(balance: number): number {
    return Math.round(balance * 100) / 100;
  }

  /**
   * Creates a new account with validation
   * @param account_number - The account number
   * @param balance - The initial balance
   * @returns Account object if valid, throws error if invalid
   */
  static createAccount(account_number: string, balance: number): Account {
    const account = { account_number, balance };
    const validation = this.validateAccount(account);
    
    if (!validation.isValid) {
      throw new Error(`Invalid account data: ${validation.errors.join(', ')}`);
    }

    return {
      account_number: account_number.trim(),
      balance: this.formatBalance(balance)
    };
  }
}
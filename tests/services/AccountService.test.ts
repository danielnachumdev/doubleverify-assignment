import { AccountService, AccountNotFoundError, InsufficientFundsError, InvalidAmountError } from '../../src/services/AccountService';
import { DataStore } from '../../src/services/DataStore';

describe('AccountService', () => {
    let accountService: AccountService;
    let dataStore: DataStore;

    beforeEach(() => {
        // Get fresh instances and reset for each test
        dataStore = DataStore.getInstance();
        dataStore.reset();
        accountService = new AccountService();
    });

    afterEach(() => {
        // Clean up after each test
        dataStore.clearAllAccounts();
    });

    describe('getBalance', () => {
        it('should return account balance for existing account', () => {
            const account = accountService.getBalance('123456789');

            expect(account.account_number).toBe('123456789');
            expect(account.balance).toBe(1000.00);
        });

        it('should throw AccountNotFoundError for non-existent account', () => {
            expect(() => {
                accountService.getBalance('999999999');
            }).toThrow(AccountNotFoundError);

            expect(() => {
                accountService.getBalance('999999999');
            }).toThrow('Account 999999999 not found');
        });

        it('should throw error for invalid account number', () => {
            expect(() => {
                accountService.getBalance('');
            }).toThrow('Account number must be a non-empty string');

            expect(() => {
                accountService.getBalance('invalid');
            }).toThrow('Invalid account number format');

            expect(() => {
                accountService.getBalance(null as any);
            }).toThrow('Account number must be a non-empty string');

            expect(() => {
                accountService.getBalance(123 as any);
            }).toThrow('Account number must be a non-empty string');
        });

        it('should handle account numbers with whitespace', () => {
            const account = accountService.getBalance(' 123456789 ');

            expect(account.account_number).toBe('123456789');
            expect(account.balance).toBe(1000.00);
        });

        it('should return a copy of the account (not reference)', () => {
            const account1 = accountService.getBalance('123456789');
            const account2 = accountService.getBalance('123456789');

            expect(account1).toEqual(account2);
            expect(account1).not.toBe(account2); // Different object references
        });
    });

    describe('withdraw', () => {
        it('should successfully withdraw money from account with sufficient funds', () => {
            const updatedAccount = accountService.withdraw('123456789', 250.00);

            expect(updatedAccount.account_number).toBe('123456789');
            expect(updatedAccount.balance).toBe(750.00);

            // Verify the account was actually updated
            const retrievedAccount = accountService.getBalance('123456789');
            expect(retrievedAccount.balance).toBe(750.00);
        });

        it('should format balance correctly after withdrawal', () => {
            const updatedAccount = accountService.withdraw('123456789', 250.123);

            expect(updatedAccount.balance).toBe(749.88); // 1000 - 250.123 = 749.877, rounded to 749.88
        });

        it('should throw InsufficientFundsError when withdrawal amount exceeds balance', () => {
            expect(() => {
                accountService.withdraw('123456789', 1500.00);
            }).toThrow(InsufficientFundsError);

            expect(() => {
                accountService.withdraw('123456789', 1500.00);
            }).toThrow('Insufficient funds for withdrawal. Account: 123456789, Requested: 1500, Available: 1000');
        });

        it('should throw InsufficientFundsError when withdrawal amount equals balance plus small amount', () => {
            expect(() => {
                accountService.withdraw('123456789', 1000.01);
            }).toThrow(InsufficientFundsError);
        });

        it('should allow withdrawal of exact balance', () => {
            const updatedAccount = accountService.withdraw('123456789', 1000.00);

            expect(updatedAccount.balance).toBe(0.00);
        });

        it('should throw AccountNotFoundError for non-existent account', () => {
            expect(() => {
                accountService.withdraw('999999999', 100.00);
            }).toThrow(AccountNotFoundError);

            expect(() => {
                accountService.withdraw('999999999', 100.00);
            }).toThrow('Account 999999999 not found');
        });

        it('should throw InvalidAmountError for invalid amounts', () => {
            expect(() => {
                accountService.withdraw('123456789', 0);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.withdraw('123456789', -100);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.withdraw('123456789', NaN);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.withdraw('123456789', Infinity);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.withdraw('123456789', 'invalid' as any);
            }).toThrow(InvalidAmountError);
        });

        it('should throw error for invalid account number', () => {
            expect(() => {
                accountService.withdraw('', 100);
            }).toThrow('Account number must be a non-empty string');

            expect(() => {
                accountService.withdraw('invalid', 100);
            }).toThrow('Invalid account number format');

            expect(() => {
                accountService.withdraw(null as any, 100);
            }).toThrow('Account number must be a non-empty string');
        });

        it('should handle account numbers with whitespace', () => {
            const updatedAccount = accountService.withdraw(' 123456789 ', 250.00);

            expect(updatedAccount.account_number).toBe('123456789');
            expect(updatedAccount.balance).toBe(750.00);
        });
    });

    describe('deposit', () => {
        it('should successfully deposit money to account', () => {
            const updatedAccount = accountService.deposit('123456789', 500.00);

            expect(updatedAccount.account_number).toBe('123456789');
            expect(updatedAccount.balance).toBe(1500.00);

            // Verify the account was actually updated
            const retrievedAccount = accountService.getBalance('123456789');
            expect(retrievedAccount.balance).toBe(1500.00);
        });

        it('should format balance correctly after deposit', () => {
            const updatedAccount = accountService.deposit('123456789', 500.123);

            expect(updatedAccount.balance).toBe(1500.12); // 1000 + 500.123 = 1500.123, rounded to 1500.12
        });

        it('should handle large deposits', () => {
            const updatedAccount = accountService.deposit('123456789', 999999.99);

            expect(updatedAccount.balance).toBe(1000999.99);
        });

        it('should throw AccountNotFoundError for non-existent account', () => {
            expect(() => {
                accountService.deposit('999999999', 100.00);
            }).toThrow(AccountNotFoundError);

            expect(() => {
                accountService.deposit('999999999', 100.00);
            }).toThrow('Account 999999999 not found');
        });

        it('should throw InvalidAmountError for invalid amounts', () => {
            expect(() => {
                accountService.deposit('123456789', 0);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.deposit('123456789', -100);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.deposit('123456789', NaN);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.deposit('123456789', Infinity);
            }).toThrow(InvalidAmountError);

            expect(() => {
                accountService.deposit('123456789', 'invalid' as any);
            }).toThrow(InvalidAmountError);
        });

        it('should throw error for invalid account number', () => {
            expect(() => {
                accountService.deposit('', 100);
            }).toThrow('Account number must be a non-empty string');

            expect(() => {
                accountService.deposit('invalid', 100);
            }).toThrow('Invalid account number format');

            expect(() => {
                accountService.deposit(null as any, 100);
            }).toThrow('Account number must be a non-empty string');
        });

        it('should handle account numbers with whitespace', () => {
            const updatedAccount = accountService.deposit(' 123456789 ', 500.00);

            expect(updatedAccount.account_number).toBe('123456789');
            expect(updatedAccount.balance).toBe(1500.00);
        });
    });

    describe('validateAmount', () => {
        it('should return true for valid amounts', () => {
            expect(accountService.validateAmount(0.01)).toBe(true);
            expect(accountService.validateAmount(100.50)).toBe(true);
            expect(accountService.validateAmount(1000000)).toBe(true);
        });

        it('should return false for invalid amounts', () => {
            expect(accountService.validateAmount(0)).toBe(false);
            expect(accountService.validateAmount(-100)).toBe(false);
            expect(accountService.validateAmount(NaN)).toBe(false);
            expect(accountService.validateAmount(Infinity)).toBe(false);
            expect(accountService.validateAmount(-Infinity)).toBe(false);
        });
    });

    describe('accountExists', () => {
        it('should return true for existing accounts', () => {
            expect(accountService.accountExists('123456789')).toBe(true);
            expect(accountService.accountExists('987654321')).toBe(true);
        });

        it('should return false for non-existing accounts', () => {
            expect(accountService.accountExists('999999999')).toBe(false);
        });

        it('should return false for invalid account numbers', () => {
            expect(accountService.accountExists('')).toBe(false);
            expect(accountService.accountExists('invalid')).toBe(false);
            expect(accountService.accountExists(null as any)).toBe(false);
            expect(accountService.accountExists(undefined as any)).toBe(false);
            expect(accountService.accountExists(123 as any)).toBe(false);
        });

        it('should handle account numbers with whitespace', () => {
            expect(accountService.accountExists(' 123456789 ')).toBe(true);
        });
    });

    describe('getAllAccounts', () => {
        it('should return all accounts', () => {
            const accounts = accountService.getAllAccounts();

            expect(accounts).toHaveLength(5);
            expect(accounts.every(account => account.account_number && typeof account.balance === 'number')).toBe(true);
        });

        it('should return empty array when no accounts exist', () => {
            dataStore.clearAllAccounts();
            const accounts = accountService.getAllAccounts();

            expect(accounts).toHaveLength(0);
        });
    });

    describe('integration tests', () => {
        it('should handle multiple operations on same account', () => {
            // Initial balance: 1000.00
            let account = accountService.getBalance('123456789');
            expect(account.balance).toBe(1000.00);

            // Deposit 500.00
            account = accountService.deposit('123456789', 500.00);
            expect(account.balance).toBe(1500.00);

            // Withdraw 250.00
            account = accountService.withdraw('123456789', 250.00);
            expect(account.balance).toBe(1250.00);

            // Deposit 100.50
            account = accountService.deposit('123456789', 100.50);
            expect(account.balance).toBe(1350.50);

            // Final balance check
            account = accountService.getBalance('123456789');
            expect(account.balance).toBe(1350.50);
        });

        it('should maintain account isolation between different accounts', () => {
            // Modify account 1
            accountService.withdraw('123456789', 200.00);

            // Modify account 2
            accountService.deposit('987654321', 300.00);

            // Check that accounts are independent
            const account1 = accountService.getBalance('123456789');
            const account2 = accountService.getBalance('987654321');

            expect(account1.balance).toBe(800.00); // 1000 - 200
            expect(account2.balance).toBe(2800.50); // 2500.50 + 300
        });
    });
});
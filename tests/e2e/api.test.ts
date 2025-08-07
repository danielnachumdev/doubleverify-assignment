import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';
import { TestHelpers } from '../utils/testHelpers';

describe('End-to-End API Tests', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    dataStore = TestHelpers.setupDataStore();
  });

  afterEach(() => {
    TestHelpers.cleanupDataStore(dataStore);
  });

  describe('Complete ATM Transaction Workflows', () => {
    it('should handle complete balance inquiry workflow', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const expectedBalance = TestHelpers.getExpectedBalance(accountNumber);

      // Test balance inquiry
      const response = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(response.body).toEqual({
        account_number: accountNumber,
        balance: expectedBalance
      });

      // Verify response headers
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle complete withdrawal workflow', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const initialBalance = TestHelpers.getExpectedBalance(accountNumber);
      const withdrawAmount = 250.00;
      const expectedFinalBalance = initialBalance - withdrawAmount;

      // Step 1: Check initial balance
      const initialBalanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(initialBalanceResponse.body.balance).toBe(initialBalance);

      // Step 2: Perform withdrawal
      const withdrawResponse = await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: withdrawAmount })
        .expect(200);

      expect(withdrawResponse.body).toEqual({
        account_number: accountNumber,
        balance: expectedFinalBalance,
        transaction: 'withdrawal',
        amount: withdrawAmount
      });

      // Step 3: Verify balance after withdrawal
      const finalBalanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(finalBalanceResponse.body.balance).toBe(expectedFinalBalance);
    });

    it('should handle complete deposit workflow', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2;
      const initialBalance = TestHelpers.getExpectedBalance(accountNumber);
      const depositAmount = 500.00;
      const expectedFinalBalance = initialBalance + depositAmount;

      // Step 1: Check initial balance
      const initialBalanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(initialBalanceResponse.body.balance).toBe(initialBalance);

      // Step 2: Perform deposit
      const depositResponse = await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: depositAmount })
        .expect(200);

      expect(depositResponse.body).toEqual({
        account_number: accountNumber,
        balance: expectedFinalBalance,
        transaction: 'deposit',
        amount: depositAmount
      });

      // Step 3: Verify balance after deposit
      const finalBalanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(finalBalanceResponse.body.balance).toBe(expectedFinalBalance);
    });

    it('should handle complex multi-transaction workflow', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4;
      const initialBalance = TestHelpers.getExpectedBalance(accountNumber);

      // Step 1: Initial balance check
      let balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(initialBalance);

      // Step 2: First deposit
      const firstDeposit = 1000.00;
      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: firstDeposit })
        .expect(200);

      // Step 3: Check balance after first deposit
      balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(initialBalance + firstDeposit);

      // Step 4: First withdrawal
      const firstWithdrawal = 750.00;
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: firstWithdrawal })
        .expect(200);

      // Step 5: Check balance after first withdrawal
      balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(initialBalance + firstDeposit - firstWithdrawal);

      // Step 6: Second deposit
      const secondDeposit = 250.00;
      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: secondDeposit })
        .expect(200);

      // Step 7: Second withdrawal
      const secondWithdrawal = 500.00;
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: secondWithdrawal })
        .expect(200);

      // Step 8: Final balance verification
      const expectedFinalBalance = initialBalance + firstDeposit - firstWithdrawal + secondDeposit - secondWithdrawal;
      balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(expectedFinalBalance);
    });

    it('should handle account depletion and replenishment workflow', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3;
      const initialBalance = TestHelpers.getExpectedBalance(accountNumber);

      // Step 1: Withdraw all money
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: initialBalance })
        .expect(200);

      // Step 2: Verify account has zero balance
      let balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(0);

      // Step 3: Try to withdraw from empty account (should fail)
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: 10.00 })
        .expect(400);

      // Step 4: Deposit money back
      const replenishAmount = 300.00;
      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: replenishAmount })
        .expect(200);

      // Step 5: Verify account is replenished
      balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(replenishAmount);

      // Step 6: Verify we can now withdraw again
      const testWithdrawal = 50.00;
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: testWithdrawal })
        .expect(200);

      // Step 7: Final balance check
      balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(replenishAmount - testWithdrawal);
    });
  });

  describe('Error Scenarios Across All Endpoints', () => {
    it('should handle non-existent account across all endpoints', async () => {
      const nonExistentAccount = TestHelpers.TEST_ACCOUNTS.NON_EXISTENT;

      // Balance inquiry should fail
      const balanceResponse = await request(app)
        .get(`/accounts/${nonExistentAccount}/balance`)
        .expect(404);
      expect(balanceResponse.body.code).toBe('ACCOUNT_NOT_FOUND');

      // Withdrawal should fail
      const withdrawResponse = await request(app)
        .post(`/accounts/${nonExistentAccount}/withdraw`)
        .send({ amount: 100.00 })
        .expect(404);
      expect(withdrawResponse.body.code).toBe('ACCOUNT_NOT_FOUND');

      // Deposit should fail
      const depositResponse = await request(app)
        .post(`/accounts/${nonExistentAccount}/deposit`)
        .send({ amount: 100.00 })
        .expect(404);
      expect(depositResponse.body.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should handle invalid account format across all endpoints', async () => {
      const invalidAccount = TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT;

      // Balance inquiry should fail
      const balanceResponse = await request(app)
        .get(`/accounts/${invalidAccount}/balance`)
        .expect(400);
      expect(balanceResponse.body.code).toBe('INVALID_ACCOUNT_NUMBER');

      // Withdrawal should fail
      const withdrawResponse = await request(app)
        .post(`/accounts/${invalidAccount}/withdraw`)
        .send({ amount: 100.00 })
        .expect(400);
      expect(withdrawResponse.body.code).toBe('INVALID_ACCOUNT_NUMBER');

      // Deposit should fail
      const depositResponse = await request(app)
        .post(`/accounts/${invalidAccount}/deposit`)
        .send({ amount: 100.00 })
        .expect(400);
      expect(depositResponse.body.code).toBe('INVALID_ACCOUNT_NUMBER');
    });

    it('should handle insufficient funds scenario', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const balance = TestHelpers.getExpectedBalance(accountNumber);
      const excessiveAmount = balance + 1000.00;

      // Withdrawal should fail due to insufficient funds
      const response = await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: excessiveAmount })
        .expect(400);

      expect(response.body.code).toBe('INSUFFICIENT_FUNDS');
      expect(response.body.error).toContain('Insufficient funds');

      // Balance should remain unchanged
      const balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);
      expect(balanceResponse.body.balance).toBe(balance);
    });

    it('should handle invalid amounts across transaction endpoints', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;

      // Test zero amounts
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: 0 })
        .expect(400);

      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: 0 })
        .expect(400);

      // Test negative amounts
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: -100 })
        .expect(400);

      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: -100 })
        .expect(400);

      // Test non-number amounts
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: 'invalid' })
        .expect(400);

      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: 'invalid' })
        .expect(400);
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response format for balance inquiry', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const response = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('account_number');
      expect(response.body).toHaveProperty('balance');
      expect(Object.keys(response.body)).toHaveLength(2);

      // Verify data types
      expect(typeof response.body.account_number).toBe('string');
      expect(typeof response.body.balance).toBe('number');

      // Verify values
      expect(response.body.account_number).toBe(accountNumber);
      expect(response.body.balance).toBeGreaterThanOrEqual(0);
    });

    it('should return consistent response format for transactions', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const amount = 100.00;

      // Test withdrawal response format
      const withdrawResponse = await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount })
        .expect(200);

      expect(withdrawResponse.body).toHaveProperty('account_number');
      expect(withdrawResponse.body).toHaveProperty('balance');
      expect(withdrawResponse.body).toHaveProperty('transaction');
      expect(withdrawResponse.body).toHaveProperty('amount');
      expect(Object.keys(withdrawResponse.body)).toHaveLength(4);

      expect(typeof withdrawResponse.body.account_number).toBe('string');
      expect(typeof withdrawResponse.body.balance).toBe('number');
      expect(typeof withdrawResponse.body.transaction).toBe('string');
      expect(typeof withdrawResponse.body.amount).toBe('number');

      expect(withdrawResponse.body.account_number).toBe(accountNumber);
      expect(withdrawResponse.body.transaction).toBe('withdrawal');
      expect(withdrawResponse.body.amount).toBe(amount);

      // Test deposit response format
      const depositResponse = await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount })
        .expect(200);

      expect(depositResponse.body).toHaveProperty('account_number');
      expect(depositResponse.body).toHaveProperty('balance');
      expect(depositResponse.body).toHaveProperty('transaction');
      expect(depositResponse.body).toHaveProperty('amount');
      expect(Object.keys(depositResponse.body)).toHaveLength(4);

      expect(depositResponse.body.account_number).toBe(accountNumber);
      expect(depositResponse.body.transaction).toBe('deposit');
      expect(depositResponse.body.amount).toBe(amount);
    });

    it('should return consistent error response format', async () => {
      const nonExistentAccount = TestHelpers.TEST_ACCOUNTS.NON_EXISTENT;

      const response = await request(app)
        .get(`/accounts/${nonExistentAccount}/balance`)
        .expect(404);

      // Verify error response structure
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');

      // Verify data types
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.code).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.path).toBe('string');
      expect(typeof response.body.method).toBe('string');

      // Verify values
      expect(response.body.code).toBe('ACCOUNT_NOT_FOUND');
      expect(response.body.method).toBe('GET');
      expect(response.body.path).toBe(`/accounts/${nonExistentAccount}/balance`);
    });
  });

  describe('Account Isolation and Data Integrity', () => {
    it('should maintain account isolation during concurrent operations', async () => {
      const account1 = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const account2 = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2;
      const initialBalance1 = TestHelpers.getExpectedBalance(account1);
      const initialBalance2 = TestHelpers.getExpectedBalance(account2);

      // Perform operations on both accounts simultaneously
      const operations = [
        request(app).post(`/accounts/${account1}/withdraw`).send({ amount: 100 }),
        request(app).post(`/accounts/${account2}/deposit`).send({ amount: 200 }),
        request(app).post(`/accounts/${account1}/deposit`).send({ amount: 50 }),
        request(app).post(`/accounts/${account2}/withdraw`).send({ amount: 75 })
      ];

      const responses = await Promise.all(operations);

      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify final balances
      const finalBalance1Response = await request(app)
        .get(`/accounts/${account1}/balance`)
        .expect(200);
      const finalBalance2Response = await request(app)
        .get(`/accounts/${account2}/balance`)
        .expect(200);

      expect(finalBalance1Response.body.balance).toBe(initialBalance1 - 100 + 50);
      expect(finalBalance2Response.body.balance).toBe(initialBalance2 + 200 - 75);
    });

    it('should handle precision correctly for decimal amounts', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;
      const initialBalance = TestHelpers.getExpectedBalance(accountNumber);

      // Test with decimal amounts
      const depositAmount = 123.45;
      const withdrawAmount = 67.89;

      // Deposit decimal amount
      await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({ amount: depositAmount })
        .expect(200);

      // Withdraw decimal amount
      await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: withdrawAmount })
        .expect(200);

      // Check final balance with proper decimal precision
      const expectedBalance = Math.round((initialBalance + depositAmount - withdrawAmount) * 100) / 100;
      const balanceResponse = await request(app)
        .get(`/accounts/${accountNumber}/balance`)
        .expect(200);

      expect(balanceResponse.body.balance).toBe(expectedBalance);
    });
  });

  describe('HTTP Method and Route Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;

      // Test unsupported methods on balance endpoint
      await request(app)
        .post(`/accounts/${accountNumber}/balance`)
        .expect(404);

      await request(app)
        .put(`/accounts/${accountNumber}/balance`)
        .expect(404);

      await request(app)
        .delete(`/accounts/${accountNumber}/balance`)
        .expect(404);

      // Test unsupported methods on transaction endpoints
      await request(app)
        .get(`/accounts/${accountNumber}/withdraw`)
        .expect(404);

      await request(app)
        .get(`/accounts/${accountNumber}/deposit`)
        .expect(404);
    });

    it('should handle invalid routes', async () => {
      // Test completely invalid routes
      await request(app)
        .get('/invalid/route')
        .expect(404);

      await request(app)
        .post('/accounts/invalid')
        .expect(404);

      await request(app)
        .get('/accounts')
        .expect(404);
    });
  });

  describe('Content-Type and Request Validation', () => {
    it('should require proper Content-Type for POST requests', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;

      // Test with text/plain Content-Type
      const response1 = await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .set('Content-Type', 'text/plain')
        .send('amount=100')
        .expect(400);

      expect(response1.body.code).toBe('INVALID_CONTENT_TYPE');

      // Test with form-encoded Content-Type
      const response2 = await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('amount=100')
        .expect(400);

      expect(response2.body.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should validate request body structure', async () => {
      const accountNumber = TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1;

      // Test with extra fields
      const response1 = await request(app)
        .post(`/accounts/${accountNumber}/withdraw`)
        .send({ amount: 100, extra: 'field' })
        .expect(400);

      expect(response1.body.code).toBe('UNEXPECTED_FIELDS');

      // Test with missing required fields
      const response2 = await request(app)
        .post(`/accounts/${accountNumber}/deposit`)
        .send({})
        .expect(400);

      expect(response2.body.code).toBe('MISSING_AMOUNT');
    });
  });
});
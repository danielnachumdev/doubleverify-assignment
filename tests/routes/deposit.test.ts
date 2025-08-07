import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';
import { TestHelpers } from '../utils/testHelpers';

describe('Deposit Endpoint', () => {
    let dataStore: DataStore;

    beforeEach(() => {
        dataStore = TestHelpers.setupDataStore();
    });

    afterEach(() => {
        TestHelpers.cleanupDataStore(dataStore);
    });

    describe('POST /accounts/:account_number/deposit', () => {
        describe('Success Cases', () => {
            it('should successfully deposit money into account', async () => {
                const depositAmount = 250.00;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + depositAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body).toEqual(
                    TestHelpers.transactionResponse(
                        TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1,
                        expectedBalance,
                        'deposit',
                        depositAmount
                    )
                );

                // Verify the account balance was actually updated
                const balanceCheck = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
                    .expect(200);

                expect(balanceCheck.body.balance).toBe(expectedBalance);
            });

            it('should handle small deposit amounts', async () => {
                const depositAmount = 0.01;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + depositAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
            });

            it('should handle large deposit amounts', async () => {
                const depositAmount = 10000.00;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + depositAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
            });

            it('should format balance correctly after deposit', async () => {
                const depositAmount = 250.123; // Amount with more than 2 decimal places
                const expectedBalance = Math.round((TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + depositAmount) * 100) / 100;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
                expect(response.body.amount).toBe(depositAmount);
            });

            it('should deposit into account with zero balance', async () => {
                // First withdraw all money to make balance zero
                const initialBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3);
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/withdraw`)
                    .send({ amount: initialBalance })
                    .expect(200);

                // Now deposit money
                const depositAmount = 500.00;
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(depositAmount);
            });
        });

        describe('Error Cases - Account Issues', () => {
            it('should return 404 for non-existent account', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/deposit`)
                    .send({ amount: 100.00 })
                    .expect(404);

                expect(response.body).toEqual(
                    TestHelpers.ERROR_MATCHERS.ACCOUNT_NOT_FOUND(TestHelpers.TEST_ACCOUNTS.NON_EXISTENT)
                );
            });

            it('should return 400 for invalid account number format', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT}/deposit`)
                    .send({ amount: 100.00 })
                    .expect(400);

                expect(response.body).toEqual(
                    TestHelpers.ERROR_MATCHERS.INVALID_ACCOUNT_NUMBER(TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT)
                );
            });
        });

        describe('Error Cases - Invalid Amounts', () => {
            it('should return 400 for zero amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: 0 })
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Amount must be greater than zero and a valid number',
                        code: 'INVALID_AMOUNT_VALUE'
                    })
                );
            });

            it('should return 400 for negative amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: -100 })
                    .expect(400);

                expect(response.body.code).toBe('INVALID_AMOUNT_VALUE');
            });

            it('should return 400 for NaN amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: NaN })
                    .expect(400);

                expect(response.body.code).toBe('MISSING_AMOUNT');
            });

            it('should return 400 for Infinity amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: Infinity })
                    .expect(400);

                expect(response.body.code).toBe('MISSING_AMOUNT');
            });

            it('should return 400 for non-number amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: 'invalid' })
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Amount must be a number',
                        code: 'INVALID_AMOUNT_TYPE'
                    })
                );
            });
        });

        describe('Error Cases - Request Validation', () => {
            it('should return 400 for missing request body', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Content-Type must be application/json',
                        code: 'INVALID_CONTENT_TYPE'
                    })
                );
            });

            it('should return 400 for missing amount field', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({})
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Amount is required',
                        code: 'MISSING_AMOUNT'
                    })
                );
            });

            it('should return 400 for unexpected fields in request', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: 100, unexpected: 'field' })
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Request contains unexpected fields',
                        code: 'UNEXPECTED_FIELDS',
                        unexpectedFields: ['unexpected'],
                        allowedFields: ['amount']
                    })
                );
            });

            it('should return 400 for invalid content type', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .set('Content-Type', 'text/plain')
                    .send('amount=100')
                    .expect(400);

                expect(response.body.code).toBe('INVALID_CONTENT_TYPE');
            });
        });

        describe('Edge Cases', () => {
            it('should handle concurrent deposit requests correctly', async () => {
                // Make multiple deposit requests simultaneously
                const depositAmount = 100;
                const requests = [
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/deposit`).send({ amount: depositAmount }),
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/deposit`).send({ amount: depositAmount }),
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/deposit`).send({ amount: depositAmount })
                ];

                const responses = await Promise.all(requests);

                // All should succeed
                responses.forEach(response => {
                    expect(response.status).toBe(200);
                    expect(response.body.transaction).toBe('deposit');
                    expect(response.body.amount).toBe(depositAmount);
                });

                // Verify final balance
                const balanceCheck = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/balance`)
                    .expect(200);

                expect(balanceCheck.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4) + (depositAmount * 3));
            });

            it('should maintain account isolation during deposits', async () => {
                const depositAmount = 200;

                // Deposit to account 1
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                // Check that account 2 balance is unchanged
                const account2Balance = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2}/balance`)
                    .expect(200);

                expect(account2Balance.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2));
            });

            it('should handle very large deposit amounts', async () => {
                const depositAmount = 999999.99;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + depositAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
            });

            it('should handle multiple deposits to same account', async () => {
                const depositAmount1 = 100.50;
                const depositAmount2 = 200.25;
                const initialBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1);

                // First deposit
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount1 })
                    .expect(200);

                // Second deposit
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount2 })
                    .expect(200);

                const expectedFinalBalance = initialBalance + depositAmount1 + depositAmount2;
                expect(response.body.balance).toBe(expectedFinalBalance);
            });
        });

        describe('HTTP Method Validation', () => {
            it('should return 404 for GET method on deposit endpoint', async () => {
                const response = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .expect(404);

                expect(response.body.code).toBe('NOT_FOUND');
            });

            it('should return 404 for PUT method on deposit endpoint', async () => {
                const response = await request(app)
                    .put(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: 100 })
                    .expect(404);

                expect(response.body.code).toBe('NOT_FOUND');
            });
        });

        describe('Error Handling Integration', () => {
            it('should handle server errors gracefully', async () => {
                // Mock a server error by temporarily breaking the data store
                const originalGetAccount = TestHelpers.mockDataStoreError(
                    dataStore,
                    new Error('Database connection failed')
                );

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: 100 })
                    .expect(500);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Database connection failed',
                        code: 'INTERNAL_ERROR',
                        timestamp: expect.any(String),
                        path: `/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`,
                        method: 'POST'
                    })
                );

                // Restore original method
                TestHelpers.restoreDataStoreMethod(dataStore, originalGetAccount);
            });

            it('should log errors appropriately', async () => {
                const consoleSpy = TestHelpers.mockConsoleError();

                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/deposit`)
                    .send({ amount: 100 })
                    .expect(404);

                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining(`ERROR: Account ${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT} not found`)
                );

                TestHelpers.restoreConsoleError(consoleSpy);
            });
        });

        describe('Business Logic Integration', () => {
            it('should work correctly with withdrawal and deposit combinations', async () => {
                const initialBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1);
                const withdrawAmount = 300;
                const depositAmount = 500;

                // First withdraw
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                // Then deposit
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                const expectedFinalBalance = initialBalance - withdrawAmount + depositAmount;
                expect(response.body.balance).toBe(expectedFinalBalance);
            });

            it('should allow deposit after account balance reaches zero', async () => {
                // Withdraw all money first
                const initialBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3);
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/withdraw`)
                    .send({ amount: initialBalance })
                    .expect(200);

                // Verify balance is zero
                const zeroBalanceCheck = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/balance`)
                    .expect(200);
                expect(zeroBalanceCheck.body.balance).toBe(0);

                // Now deposit money
                const depositAmount = 250;
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/deposit`)
                    .send({ amount: depositAmount })
                    .expect(200);

                expect(response.body.balance).toBe(depositAmount);
            });
        });
    });
});
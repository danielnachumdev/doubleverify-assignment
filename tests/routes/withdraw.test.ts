import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';
import { TestHelpers } from '../utils/testHelpers';

describe('Withdrawal Endpoint', () => {
    let dataStore: DataStore;

    beforeEach(() => {
        dataStore = TestHelpers.setupDataStore();
    });

    afterEach(() => {
        TestHelpers.cleanupDataStore(dataStore);
    });

    describe('POST /accounts/:account_number/withdraw', () => {
        describe('Success Cases', () => {
            it('should successfully withdraw money from account with sufficient funds', async () => {
                const withdrawAmount = 250.00;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) - withdrawAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                expect(response.body).toEqual(
                    TestHelpers.transactionResponse(
                        TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1,
                        expectedBalance,
                        'withdrawal',
                        withdrawAmount
                    )
                );

                // Verify the account balance was actually updated
                const balanceCheck = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
                    .expect(200);

                expect(balanceCheck.body.balance).toBe(expectedBalance);
            });

            it('should allow withdrawal of exact balance', async () => {
                const withdrawAmount = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3);

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                expect(response.body).toEqual(
                    TestHelpers.transactionResponse(
                        TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3,
                        0.00,
                        'withdrawal',
                        withdrawAmount
                    )
                );
            });

            it('should format balance correctly after withdrawal', async () => {
                const withdrawAmount = 250.123; // Amount with more than 2 decimal places
                const expectedBalance = Math.round((TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) - withdrawAmount) * 100) / 100;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
                expect(response.body.amount).toBe(withdrawAmount);
            });

            it('should handle small withdrawal amounts', async () => {
                const withdrawAmount = 0.01;
                const expectedBalance = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) - withdrawAmount;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                expect(response.body.balance).toBe(expectedBalance);
            });
        });

        describe('Error Cases - Account Issues', () => {
            it('should return 404 for non-existent account', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/withdraw`)
                    .send({ amount: 100.00 })
                    .expect(404);

                expect(response.body).toEqual(
                    TestHelpers.ERROR_MATCHERS.ACCOUNT_NOT_FOUND(TestHelpers.TEST_ACCOUNTS.NON_EXISTENT)
                );
            });

            it('should return 400 for invalid account number format', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT}/withdraw`)
                    .send({ amount: 100.00 })
                    .expect(400);

                expect(response.body).toEqual(
                    TestHelpers.ERROR_MATCHERS.INVALID_ACCOUNT_NUMBER(TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT)
                );
            });
        });

        describe('Error Cases - Insufficient Funds', () => {
            it('should return 400 when withdrawal amount exceeds balance', async () => {
                const withdrawAmount = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + 500;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(400);

                expect(response.body).toEqual(
                    expect.objectContaining(TestHelpers.ERROR_MATCHERS.INSUFFICIENT_FUNDS)
                );
                expect(response.body.error).toContain('Insufficient funds');
            });

            it('should return 400 when withdrawal amount equals balance plus small amount', async () => {
                const withdrawAmount = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1) + 0.01;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(400);

                expect(response.body.code).toBe('INSUFFICIENT_FUNDS');
            });
        });

        describe('Error Cases - Invalid Amounts', () => {
            it('should return 400 for zero amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: -100 })
                    .expect(400);

                expect(response.body.code).toBe('INVALID_AMOUNT_VALUE');
            });

            it('should return 400 for NaN amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: NaN })
                    .expect(400);

                expect(response.body.code).toBe('MISSING_AMOUNT');
            });

            it('should return 400 for Infinity amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: Infinity })
                    .expect(400);

                expect(response.body.code).toBe('MISSING_AMOUNT');
            });

            it('should return 400 for non-number amount', async () => {
                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .set('Content-Type', 'text/plain')
                    .send('amount=100')
                    .expect(400);

                expect(response.body.code).toBe('INVALID_CONTENT_TYPE');
            });
        });

        describe('Edge Cases', () => {
            it('should handle concurrent withdrawal requests correctly', async () => {
                // Make multiple withdrawal requests simultaneously
                const withdrawAmount = 100;
                const requests = [
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/withdraw`).send({ amount: withdrawAmount }),
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/withdraw`).send({ amount: withdrawAmount }),
                    request(app).post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/withdraw`).send({ amount: withdrawAmount })
                ];

                const responses = await Promise.all(requests);

                // All should succeed since account 4 has 5000.00 balance
                responses.forEach(response => {
                    expect(response.status).toBe(200);
                    expect(response.body.transaction).toBe('withdrawal');
                    expect(response.body.amount).toBe(withdrawAmount);
                });

                // Verify final balance
                const balanceCheck = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/balance`)
                    .expect(200);

                expect(balanceCheck.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4) - (withdrawAmount * 3));
            });

            it('should maintain account isolation during withdrawals', async () => {
                const withdrawAmount = 200;

                // Withdraw from account 1
                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                // Check that account 2 balance is unchanged
                const account2Balance = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2}/balance`)
                    .expect(200);

                expect(account2Balance.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2));
            });

            it('should handle very large withdrawal amounts within balance', async () => {
                const withdrawAmount = TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4) - 0.01;

                const response = await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_4}/withdraw`)
                    .send({ amount: withdrawAmount })
                    .expect(200);

                expect(response.body.balance).toBe(0.01);
            });
        });

        describe('HTTP Method Validation', () => {
            it('should return 404 for GET method on withdraw endpoint', async () => {
                const response = await request(app)
                    .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .expect(404);

                expect(response.body.code).toBe('NOT_FOUND');
            });

            it('should return 404 for PUT method on withdraw endpoint', async () => {
                const response = await request(app)
                    .put(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
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
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`)
                    .send({ amount: 100 })
                    .expect(500);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        error: 'Database connection failed',
                        code: 'INTERNAL_ERROR',
                        timestamp: expect.any(String),
                        path: `/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/withdraw`,
                        method: 'POST'
                    })
                );

                // Restore original method
                TestHelpers.restoreDataStoreMethod(dataStore, originalGetAccount);
            });

            it('should log errors appropriately', async () => {
                const consoleSpy = TestHelpers.mockConsoleError();

                await request(app)
                    .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/withdraw`)
                    .send({ amount: 100 })
                    .expect(404);

                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining(`ERROR: Account ${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT} not found`)
                );

                TestHelpers.restoreConsoleError(consoleSpy);
            });
        });
    });
});
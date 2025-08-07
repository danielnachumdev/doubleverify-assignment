import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';
import { TestHelpers } from '../utils/testHelpers';

describe('POST /accounts - Create Account', () => {
    let dataStore: DataStore;

    beforeEach(() => {
        dataStore = TestHelpers.setupDataStore();
    });

    afterEach(() => {
        TestHelpers.cleanupDataStore(dataStore);
    });

    describe('Successful Account Creation', () => {
        it('should create a new account with valid data', async () => {
            const newAccountData = {
                account_number: '444555666',
                initial_balance: 1500.75
            };

            const response = await request(app)
                .post('/accounts')
                .send(newAccountData)
                .expect(201);

            expect(response.body).toEqual({
                account_number: '444555666',
                balance: 1500.75,
                transaction: 'account_created',
                timestamp: expect.any(String)
            });

            // Verify account was actually created
            const balanceResponse = await request(app)
                .get('/accounts/444555666/balance')
                .expect(200);

            expect(balanceResponse.body.balance).toBe(1500.75);
        });

        it('should create account with zero initial balance', async () => {
            const newAccountData = {
                account_number: '777888999',
                initial_balance: 0
            };

            const response = await request(app)
                .post('/accounts')
                .send(newAccountData)
                .expect(201);

            expect(response.body.balance).toBe(0);
        });

        it('should trim whitespace from account number', async () => {
            const newAccountData = {
                account_number: '  666777888  ',
                initial_balance: 100
            };

            const response = await request(app)
                .post('/accounts')
                .send(newAccountData)
                .expect(201);

            expect(response.body.account_number).toBe('666777888');
        });

        it('should format balance to 2 decimal places', async () => {
            const newAccountData = {
                account_number: '888999000',
                initial_balance: 123.456789
            };

            const response = await request(app)
                .post('/accounts')
                .send(newAccountData)
                .expect(201);

            expect(response.body.balance).toBe(123.46);
        });
    });

    describe('Validation Errors', () => {
        it('should reject request without account_number', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Account number is required');
            expect(response.body.code).toBe('INVALID_ACCOUNT_NUMBER');
        });

        it('should reject request with non-string account_number', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: 123456789, initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Account number is required and must be a string');
            expect(response.body.code).toBe('INVALID_ACCOUNT_NUMBER');
        });

        it('should reject request without initial_balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789' })
                .expect(400);

            expect(response.body.error).toContain('Initial balance is required');
            expect(response.body.code).toBe('INVALID_INITIAL_BALANCE');
        });

        it('should reject request with non-number initial_balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789', initial_balance: '1000' })
                .expect(400);

            expect(response.body.error).toContain('Initial balance must be a valid number');
            expect(response.body.code).toBe('INVALID_INITIAL_BALANCE');
        });

        it('should reject request with negative initial_balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789', initial_balance: -100 })
                .expect(400);

            expect(response.body.error).toContain('Initial balance cannot be negative');
            expect(response.body.code).toBe('INVALID_INITIAL_BALANCE');
        });

        it('should reject request with NaN initial_balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789', initial_balance: NaN })
                .expect(400);

            expect(response.body.error).toContain('Initial balance is required');
            expect(response.body.code).toBe('INVALID_INITIAL_BALANCE');
        });

        it('should reject request with Infinity initial_balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789', initial_balance: Infinity })
                .expect(400);

            expect(response.body.error).toContain('Initial balance is required');
            expect(response.body.code).toBe('INVALID_INITIAL_BALANCE');
        });

        it('should reject invalid account number format', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: 'invalid', initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Invalid account number format');
            expect(response.body.code).toBe('VALIDATION_ERROR');
        });

        it('should reject account number that is too short', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '12345', initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Invalid account number format');
        });

        it('should reject account number that is too long', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '1234567890123', initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Invalid account number format');
        });

        it('should reject extra fields in request body', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({
                    account_number: '123456789',
                    initial_balance: 1000,
                    extra_field: 'not allowed'
                })
                .expect(400);

            expect(response.body.error).toContain('Request contains unexpected fields');
        });
    });

    describe('Business Logic Errors', () => {
        it('should reject duplicate account creation', async () => {
            const accountData = {
                account_number: '444555666',
                initial_balance: 1000
            };

            // Create account first time
            await request(app)
                .post('/accounts')
                .send(accountData)
                .expect(201);

            // Try to create same account again
            const response = await request(app)
                .post('/accounts')
                .send(accountData)
                .expect(400);

            expect(response.body.error).toContain('Account 444555666 already exists');
            expect(response.body.code).toBe('ACCOUNT_ALREADY_EXISTS');
        });

        it('should reject duplicate account creation with seeded accounts', async () => {
            // The data store is already seeded in beforeEach via reset()
            // Try to create account with same number as seeded account
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789', initial_balance: 1000 })
                .expect(400);

            expect(response.body.error).toContain('Account 123456789 already exists');
            expect(response.body.code).toBe('ACCOUNT_ALREADY_EXISTS');
        });
    });

    describe('Content Type Validation', () => {
        it('should reject request without Content-Type header', async () => {
            const response = await request(app)
                .post('/accounts')
                .send('{"account_number": "123456789", "initial_balance": 1000}')
                .expect(400);

            expect(response.body.error).toContain('Content-Type must be application/json');
        });

        it('should reject request with wrong Content-Type', async () => {
            const response = await request(app)
                .post('/accounts')
                .set('Content-Type', 'text/plain')
                .send('{"account_number": "123456789", "initial_balance": 1000}')
                .expect(400);

            expect(response.body.error).toContain('Content-Type must be application/json');
        });

        it('should reject request with invalid JSON', async () => {
            const response = await request(app)
                .post('/accounts')
                .set('Content-Type', 'application/json')
                .send('{"account_number": "123456789", "initial_balance":}')
                .expect(400);

            expect(response.body.error).toContain('Invalid JSON format in request body');
        });
    });

    describe('Integration with Other Endpoints', () => {
        it('should allow operations on newly created account', async () => {
            // Create account
            const createResponse = await request(app)
                .post('/accounts')
                .send({ account_number: '888777666', initial_balance: 500 })
                .expect(201);

            expect(createResponse.body.balance).toBe(500);

            // Check balance
            const balanceResponse = await request(app)
                .get('/accounts/888777666/balance')
                .expect(200);

            expect(balanceResponse.body.balance).toBe(500);

            // Make deposit
            const depositResponse = await request(app)
                .post('/accounts/888777666/deposit')
                .send({ amount: 100 })
                .expect(200);

            expect(depositResponse.body.balance).toBe(600);

            // Make withdrawal
            const withdrawResponse = await request(app)
                .post('/accounts/888777666/withdraw')
                .send({ amount: 150 })
                .expect(200);

            expect(withdrawResponse.body.balance).toBe(450);

            // Final balance check
            const finalBalanceResponse = await request(app)
                .get('/accounts/888777666/balance')
                .expect(200);

            expect(finalBalanceResponse.body.balance).toBe(450);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large initial balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '333444555', initial_balance: 999999999.99 })
                .expect(201);

            expect(response.body.balance).toBe(999999999.99);
        });

        it('should handle very small initial balance', async () => {
            const response = await request(app)
                .post('/accounts')
                .send({ account_number: '444555666', initial_balance: 0.01 })
                .expect(201);

            expect(response.body.balance).toBe(0.01);
        });

        it('should handle account numbers at boundary lengths', async () => {
            // 6 digits (minimum)
            const response1 = await request(app)
                .post('/accounts')
                .send({ account_number: '123456', initial_balance: 100 })
                .expect(201);

            expect(response1.body.account_number).toBe('123456');

            // 12 digits (maximum)
            const response2 = await request(app)
                .post('/accounts')
                .send({ account_number: '123456789012', initial_balance: 200 })
                .expect(201);

            expect(response2.body.account_number).toBe('123456789012');
        });
    });
});
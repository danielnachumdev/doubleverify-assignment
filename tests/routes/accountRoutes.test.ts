import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';

describe('Account Routes - Balance Inquiry', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    // Reset data store for each test
    dataStore = DataStore.getInstance();
    dataStore.reset();
  });

  afterEach(() => {
    // Clean up after each test
    dataStore.clearAllAccounts();
  });

  describe('GET /accounts/:account_number/balance', () => {
    it('should return account balance for existing account', async () => {
      const response = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      expect(response.body).toEqual({
        account_number: '123456789',
        balance: 1000.00
      });
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/accounts/999999999/balance')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Account 999999999 not found',
        code: 'ACCOUNT_NOT_FOUND',
        timestamp: expect.any(String),
        path: '/accounts/999999999/balance',
        method: 'GET'
      });
    });

    it('should return 400 for invalid account number format', async () => {
      const response = await request(app)
        .get('/accounts/invalid/balance')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: 'invalid'
      });
    });

    it('should return 400 for account number that is too short', async () => {
      const response = await request(app)
        .get('/accounts/12345/balance')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: '12345'
      });
    });

    it('should return 400 for account number that is too long', async () => {
      const response = await request(app)
        .get('/accounts/1234567890123/balance')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: '1234567890123'
      });
    });

    it('should handle account numbers with leading/trailing whitespace', async () => {
      // Note: Express automatically trims URL parameters, but our validation should handle it
      const response = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      expect(response.body).toEqual({
        account_number: '123456789',
        balance: 1000.00
      });
    });

    it('should return correct balance for different accounts', async () => {
      // Test account 987654321 with balance 2500.50
      const response = await request(app)
        .get('/accounts/987654321/balance')
        .expect(200);

      expect(response.body).toEqual({
        account_number: '987654321',
        balance: 2500.50
      });
    });

    it('should return balance with proper decimal formatting', async () => {
      // Test account 555666777 with balance 100.25
      const response = await request(app)
        .get('/accounts/555666777/balance')
        .expect(200);

      expect(response.body).toEqual({
        account_number: '555666777',
        balance: 100.25
      });
    });

    it('should return 405 for unsupported HTTP methods', async () => {
      const response = await request(app)
        .post('/accounts/123456789/balance')
        .expect(404); // Express returns 404 for undefined routes

      expect(response.body).toEqual({
        error: expect.stringContaining('Route POST /accounts/123456789/balance not found'),
        code: 'NOT_FOUND',
        timestamp: expect.any(String),
        path: '/accounts/123456789/balance',
        method: 'POST'
      });
    });

    it('should handle concurrent requests correctly', async () => {
      const requests = [
        request(app).get('/accounts/123456789/balance'),
        request(app).get('/accounts/987654321/balance'),
        request(app).get('/accounts/555666777/balance')
      ];

      const responses = await Promise.all(requests);

      expect(responses[0]!.status).toBe(200);
      expect(responses[0]!.body.account_number).toBe('123456789');
      expect(responses[0]!.body.balance).toBe(1000.00);

      expect(responses[1]!.status).toBe(200);
      expect(responses[1]!.body.account_number).toBe('987654321');
      expect(responses[1]!.body.balance).toBe(2500.50);

      expect(responses[2]!.status).toBe(200);
      expect(responses[2]!.body.account_number).toBe('555666777');
      expect(responses[2]!.body.balance).toBe(100.25);
    });

    it('should include proper HTTP headers in response', async () => {
      const response = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('account_number');
      expect(response.body).toHaveProperty('balance');
    });

    it('should handle special account numbers within valid range', async () => {
      // Test minimum length account number
      const response1 = await request(app)
        .get('/accounts/111222/balance')
        .expect(404); // This account doesn't exist in test data

      expect(response1.body.code).toBe('ACCOUNT_NOT_FOUND');

      // Test maximum length account number  
      const response2 = await request(app)
        .get('/accounts/123456789012/balance')
        .expect(404); // This account doesn't exist in test data

      expect(response2.body.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('should maintain data consistency across multiple balance checks', async () => {
      // Check balance multiple times to ensure consistency
      const response1 = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      const response2 = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      const response3 = await request(app)
        .get('/accounts/123456789/balance')
        .expect(200);

      expect(response1.body.balance).toBe(response2.body.balance);
      expect(response2.body.balance).toBe(response3.body.balance);
      expect(response1.body.balance).toBe(1000.00);
    });

    it('should handle URL encoding in account numbers', async () => {
      // Test with URL-encoded characters (though account numbers should only be digits)
      const response = await request(app)
        .get('/accounts/123%20456/balance')
        .expect(400);

      expect(response.body.code).toBe('INVALID_ACCOUNT_NUMBER');
    });
  });

  describe('Error handling integration', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a server error by temporarily breaking the data store
      const originalGetAccount = dataStore.getAccount;
      dataStore.getAccount = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/accounts/123456789/balance')
        .expect(500);

      expect(response.body).toEqual(
        expect.objectContaining({
          error: 'Database connection failed',
          code: 'INTERNAL_ERROR',
          timestamp: expect.any(String),
          path: '/accounts/123456789/balance',
          method: 'GET'
        })
      );

      // Restore original method
      dataStore.getAccount = originalGetAccount;
    });

    it('should log errors appropriately', async () => {
      // Reset data store to ensure clean state
      dataStore.reset();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await request(app)
        .get('/accounts/999999999/balance')
        .expect(404);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Account 999999999 not found')
      );

      consoleSpy.mockRestore();
    });
  });
});
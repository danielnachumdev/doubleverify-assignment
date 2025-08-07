import request from 'supertest';
import app from '../../src/server';
import { DataStore } from '../../src/services/DataStore';
import { TestHelpers } from '../utils/testHelpers';

describe('Balance Inquiry Endpoint', () => {
  let dataStore: DataStore;

  beforeEach(() => {
    dataStore = TestHelpers.setupDataStore();
  });

  afterEach(() => {
    TestHelpers.cleanupDataStore(dataStore);
  });

  describe('GET /accounts/:account_number/balance', () => {
    describe('Success Cases', () => {
      it('should return account balance for existing account', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        expect(response.body).toEqual(
          TestHelpers.balanceResponse(
            TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1,
            TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1)
          )
        );
      });

      it('should return correct balance for different accounts', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2}/balance`)
          .expect(200);

        expect(response.body).toEqual(
          TestHelpers.balanceResponse(
            TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2,
            TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2)
          )
        );
      });

      it('should return balance with proper decimal formatting', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/balance`)
          .expect(200);

        expect(response.body).toEqual(
          TestHelpers.balanceResponse(
            TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3,
            TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3)
          )
        );
      });

      it('should include proper HTTP headers in response', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(response.body).toHaveProperty('account_number');
        expect(response.body).toHaveProperty('balance');
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent account', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/balance`)
          .expect(404);

        expect(response.body).toEqual(
          TestHelpers.ERROR_MATCHERS.ACCOUNT_NOT_FOUND(TestHelpers.TEST_ACCOUNTS.NON_EXISTENT)
        );
      });

      it('should return 400 for invalid account number format', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT}/balance`)
          .expect(400);

        expect(response.body).toEqual(
          TestHelpers.ERROR_MATCHERS.INVALID_ACCOUNT_NUMBER(TestHelpers.TEST_ACCOUNTS.INVALID_FORMAT)
        );
      });

      it('should return 400 for account number that is too short', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.INVALID_SHORT}/balance`)
          .expect(400);

        expect(response.body).toEqual(
          TestHelpers.ERROR_MATCHERS.INVALID_ACCOUNT_NUMBER(TestHelpers.TEST_ACCOUNTS.INVALID_SHORT)
        );
      });

      it('should return 400 for account number that is too long', async () => {
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.INVALID_LONG}/balance`)
          .expect(400);

        expect(response.body).toEqual(
          TestHelpers.ERROR_MATCHERS.INVALID_ACCOUNT_NUMBER(TestHelpers.TEST_ACCOUNTS.INVALID_LONG)
        );
      });

      it('should handle URL encoding in account numbers', async () => {
        const response = await request(app)
          .get('/accounts/123%20456/balance')
          .expect(400);

        expect(response.body.code).toBe('INVALID_ACCOUNT_NUMBER');
      });
    });

    describe('Edge Cases', () => {
      it('should handle account numbers with leading/trailing whitespace', async () => {
        // Note: Express automatically trims URL parameters, but our validation should handle it
        const response = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        expect(response.body).toEqual(
          TestHelpers.balanceResponse(
            TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1,
            TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1)
          )
        );
      });

      it('should handle concurrent requests correctly', async () => {
        const requests = [
          request(app).get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`),
          request(app).get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2}/balance`),
          request(app).get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3}/balance`)
        ];

        const responses = await Promise.all(requests);

        expect(responses[0]!.status).toBe(200);
        expect(responses[0]!.body.account_number).toBe(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1);
        expect(responses[0]!.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1));

        expect(responses[1]!.status).toBe(200);
        expect(responses[1]!.body.account_number).toBe(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2);
        expect(responses[1]!.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_2));

        expect(responses[2]!.status).toBe(200);
        expect(responses[2]!.body.account_number).toBe(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3);
        expect(responses[2]!.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_3));
      });

      it('should maintain data consistency across multiple balance checks', async () => {
        // Check balance multiple times to ensure consistency
        const response1 = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        const response2 = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        const response3 = await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(200);

        expect(response1.body.balance).toBe(response2.body.balance);
        expect(response2.body.balance).toBe(response3.body.balance);
        expect(response1.body.balance).toBe(TestHelpers.getExpectedBalance(TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1));
      });
    });

    describe('HTTP Method Validation', () => {
      it('should return 404 for unsupported HTTP methods', async () => {
        const response = await request(app)
          .post(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(404);

        expect(response.body).toEqual(
          expect.objectContaining(
            TestHelpers.ERROR_MATCHERS.ROUTE_NOT_FOUND('POST', `/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          )
        );
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
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`)
          .expect(500);

        expect(response.body).toEqual(
          expect.objectContaining({
            error: 'Database connection failed',
            code: 'INTERNAL_ERROR',
            timestamp: expect.any(String),
            path: `/accounts/${TestHelpers.TEST_ACCOUNTS.VALID_ACCOUNT_1}/balance`,
            method: 'GET'
          })
        );

        // Restore original method
        TestHelpers.restoreDataStoreMethod(dataStore, originalGetAccount);
      });

      it('should log errors appropriately', async () => {
        // Reset data store to ensure clean state
        dataStore.reset();
        
        const consoleSpy = TestHelpers.mockConsoleError();

        await request(app)
          .get(`/accounts/${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT}/balance`)
          .expect(404);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`ERROR: Account ${TestHelpers.TEST_ACCOUNTS.NON_EXISTENT} not found`)
        );

        TestHelpers.restoreConsoleError(consoleSpy);
      });
    });
  });
});
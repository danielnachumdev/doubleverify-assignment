import { Request, Response, NextFunction } from 'express';
import { ErrorHandlingMiddleware } from '../../src/middleware/ErrorHandlingMiddleware';
import { AccountNotFoundError, InsufficientFundsError, InvalidAmountError } from '../../src/services/AccountService';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

// Mock Express objects
const mockRequest = (method: string = 'GET', url: string = '/test', headers: any = {}): Request => ({
    method,
    originalUrl: url,
    url,
    get: (header: string) => headers[header.toLowerCase()],
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' }
} as Request);

const mockResponse = (): Response => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.headersSent = false;
    return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('ErrorHandlingMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('handleError', () => {
        it('should handle AccountNotFoundError with 404 status', () => {
            const error = new AccountNotFoundError('123456789');
            const req = mockRequest('GET', '/accounts/123456789/balance');
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Account 123456789 not found',
                code: 'ACCOUNT_NOT_FOUND',
                timestamp: expect.any(String),
                path: '/accounts/123456789/balance',
                method: 'GET'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle InsufficientFundsError with 400 status', () => {
            const error = new InsufficientFundsError('123456789', 1500, 1000);
            const req = mockRequest('POST', '/accounts/123456789/withdraw');
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining('Insufficient funds'),
                code: 'INSUFFICIENT_FUNDS',
                timestamp: expect.any(String),
                path: '/accounts/123456789/withdraw',
                method: 'POST'
            });
        });

        it('should handle InvalidAmountError with 400 status', () => {
            const error = new InvalidAmountError('Amount must be greater than zero');
            const req = mockRequest('POST', '/accounts/123456789/deposit');
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Amount must be greater than zero',
                code: 'INVALID_AMOUNT',
                timestamp: expect.any(String),
                path: '/accounts/123456789/deposit',
                method: 'POST'
            });
        });

        it('should handle ValidationError with details', () => {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            (error as any).details = { field: 'amount', message: 'Required' };
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                timestamp: expect.any(String),
                path: '/test',
                method: 'GET',
                details: { field: 'amount', message: 'Required' }
            });
        });

        it('should handle JSON syntax errors', () => {
            const error = new SyntaxError('Unexpected token in JSON');
            (error as any).body = true;
            const req = mockRequest('POST', '/accounts/123456789/deposit');
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid JSON format in request body',
                code: 'INVALID_JSON',
                timestamp: expect.any(String),
                path: '/accounts/123456789/deposit',
                method: 'POST'
            });
        });

        it('should handle rate limiting errors', () => {
            const error = new Error('Too many requests');
            (error as any).status = 429;
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                timestamp: expect.any(String),
                path: '/test',
                method: 'GET'
            });
        });

        it('should handle generic HTTP errors with status code', () => {
            const error = new Error('Forbidden');
            (error as any).status = 403;
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Forbidden',
                code: 'FORBIDDEN',
                timestamp: expect.any(String),
                path: '/test',
                method: 'GET'
            });
        });

        it('should handle unexpected errors with 500 status', () => {
            const error = new Error('Unexpected error');
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Unexpected error',
                    code: 'INTERNAL_ERROR',
                    timestamp: expect.any(String),
                    path: '/test',
                    method: 'GET'
                })
            );
        });

        it('should delegate to default handler if headers already sent', () => {
            const error = new Error('Test error');
            const req = mockRequest();
            const res = mockResponse();
            res.headersSent = true;
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should include stack trace in non-production environment', () => {
            const originalEnv = process.env['NODE_ENV'];
            process.env['NODE_ENV'] = 'development';

            const error = new Error('Test error');
            error.stack = 'Error stack trace';
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: 'Error stack trace'
                })
            );

            process.env['NODE_ENV'] = originalEnv;
        });

        it('should hide error details in production environment', () => {
            const originalEnv = process.env['NODE_ENV'];
            process.env['NODE_ENV'] = 'production';

            const error = new Error('Detailed error message');
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                timestamp: expect.any(String),
                path: '/test',
                method: 'GET'
            });

            process.env['NODE_ENV'] = originalEnv;
        });
    });

    describe('handleNotFound', () => {
        it('should create 404 error for undefined routes', () => {
            const req = mockRequest('GET', '/nonexistent');
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleNotFound(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Route GET /nonexistent not found',
                    status: 404
                })
            );
        });
    });

    describe('asyncHandler', () => {
        it('should catch async errors and pass to next', async () => {
            const asyncFunction = jest.fn().mockRejectedValue(new Error('Async error'));
            const wrappedFunction = ErrorHandlingMiddleware.asyncHandler(asyncFunction);
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await wrappedFunction(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Async error'
            }));
        });

        it('should not interfere with successful async functions', async () => {
            const asyncFunction = jest.fn().mockResolvedValue('success');
            const wrappedFunction = ErrorHandlingMiddleware.asyncHandler(asyncFunction);
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await wrappedFunction(req, res, next);

            expect(asyncFunction).toHaveBeenCalledWith(req, res, next);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('createError', () => {
        it('should create error with default status 500', () => {
            const error = ErrorHandlingMiddleware.createError('Test error');

            expect(error.message).toBe('Test error');
            expect((error as any).status).toBe(500);
            expect((error as any).code).toBe('INTERNAL_ERROR');
        });

        it('should create error with custom status and code', () => {
            const error = ErrorHandlingMiddleware.createError('Bad request', 400, 'CUSTOM_ERROR');

            expect(error.message).toBe('Bad request');
            expect((error as any).status).toBe(400);
            expect((error as any).code).toBe('CUSTOM_ERROR');
        });

        it('should generate code from status when not provided', () => {
            const error = ErrorHandlingMiddleware.createError('Not found', 404);

            expect((error as any).code).toBe('NOT_FOUND');
        });
    });

    describe('handleCorsError', () => {
        it('should handle CORS errors', () => {
            const error = new Error('CORS policy violation');
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleCorsError(error, req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Cross-Origin Resource Sharing (CORS) error',
                    status: 403
                })
            );
        });

        it('should pass through non-CORS errors', () => {
            const error = new Error('Regular error');
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleCorsError(error, req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('error logging', () => {
        it('should log error information', () => {
            const error = new Error('Test error');
            const req = mockRequest('POST', '/test', { 'user-agent': 'Test Agent' });
            const res = mockResponse();
            const next = mockNext();

            ErrorHandlingMiddleware.handleError(error, req, res, next);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('ERROR: Test error')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Request: POST /test')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('User-Agent: Test Agent')
            );
        });
    });
});
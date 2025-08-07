import { Response, NextFunction } from 'express';
import { ValidationMiddleware, ValidatedRequest } from '../../src/middleware/ValidationMiddleware';

// Mock Express objects
const mockRequest = (params: any = {}, body: any = {}, headers: any = {}): ValidatedRequest => {
  const req = {
    params,
    body,
    get: (header: string) => headers[header.toLowerCase()],
    method: 'GET'
  } as ValidatedRequest;
  return req;
};

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.headersSent = false;
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('ValidationMiddleware', () => {
  describe('validateAccountNumber', () => {
    it('should pass validation for valid account number', () => {
      const req = mockRequest({ account_number: '123456789' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(req.validatedAccountNumber).toBe('123456789');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should trim whitespace from account number', () => {
      const req = mockRequest({ account_number: ' 123456789 ' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(req.validatedAccountNumber).toBe('123456789');
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing account number', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account number is required',
        code: 'MISSING_ACCOUNT_NUMBER'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid account number format', () => {
      const req = mockRequest({ account_number: 'invalid' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: 'invalid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject account number that is too short', () => {
      const req = mockRequest({ account_number: '12345' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: '12345'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject account number that is too long', () => {
      const req = mockRequest({ account_number: '1234567890123' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAccountNumber(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateAmount', () => {
    it('should pass validation for valid amount', () => {
      const req = mockRequest({}, { amount: 100.50 });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(req.validatedAmount).toBe(100.50);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing amount', () => {
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject null amount', () => {
      const req = mockRequest({}, { amount: null });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-number amount', () => {
      const req = mockRequest({}, { amount: '100' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount must be a number',
        code: 'INVALID_AMOUNT_TYPE',
        provided: 'string'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject zero amount', () => {
      const req = mockRequest({}, { amount: 0 });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount must be greater than zero and a valid number',
        code: 'INVALID_AMOUNT_VALUE',
        provided: 0
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject negative amount', () => {
      const req = mockRequest({}, { amount: -100 });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount must be greater than zero and a valid number',
        code: 'INVALID_AMOUNT_VALUE',
        provided: -100
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject NaN amount', () => {
      const req = mockRequest({}, { amount: NaN });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Amount must be greater than zero and a valid number',
        code: 'INVALID_AMOUNT_VALUE',
        provided: NaN
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject Infinity amount', () => {
      const req = mockRequest({}, { amount: Infinity });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateAmount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateRequestBody', () => {
    it('should pass validation for valid request body', () => {
      const req = mockRequest({}, { amount: 100 });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateRequestBody(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing request body', () => {
      const req = mockRequest({}, null);
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateRequestBody(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Request body is required and must be a valid JSON object',
        code: 'INVALID_REQUEST_BODY'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-object request body', () => {
      const req = mockRequest({}, 'invalid');
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateRequestBody(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateAllowedFields', () => {
    it('should pass validation when only allowed fields are present', () => {
      const req = mockRequest({}, { amount: 100 });
      const res = mockResponse();
      const next = mockNext();
      const middleware = ValidationMiddleware.validateAllowedFields(['amount']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request with unexpected fields', () => {
      const req = mockRequest({}, { amount: 100, unexpected: 'field' });
      const res = mockResponse();
      const next = mockNext();
      const middleware = ValidationMiddleware.validateAllowedFields(['amount']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Request contains unexpected fields',
        code: 'UNEXPECTED_FIELDS',
        unexpectedFields: ['unexpected'],
        allowedFields: ['amount']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation with empty body when no fields are allowed', () => {
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();
      const middleware = ValidationMiddleware.validateAllowedFields([]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateContentType', () => {
    it('should pass validation for application/json content type', () => {
      const req = mockRequest({}, {}, { 'content-type': 'application/json' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation for application/json with charset', () => {
      const req = mockRequest({}, {}, { 'content-type': 'application/json; charset=utf-8' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateContentType(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject missing content type', () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateContentType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE',
        provided: 'none'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid content type', () => {
      const req = mockRequest({}, {}, { 'content-type': 'text/plain' });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.validateContentType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE',
        provided: 'text/plain'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeInput', () => {
    it('should trim account number parameter', () => {
      const req = mockRequest({ account_number: ' 123456789 ' }, {});
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.sanitizeInput(req, res, next);

      expect(req.params['account_number']).toBe('123456789');
      expect(next).toHaveBeenCalled();
    });

    it('should round amount to 2 decimal places', () => {
      const req = mockRequest({}, { amount: 100.999 });
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.sanitizeInput(req, res, next);

      expect(req.body.amount).toBe(101.00);
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing parameters gracefully', () => {
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext();

      ValidationMiddleware.sanitizeInput(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateMethod', () => {
    it('should pass validation for allowed method', () => {
      const req = mockRequest();
      req.method = 'GET';
      const res = mockResponse();
      const next = mockNext();
      const middleware = ValidationMiddleware.validateMethod(['GET', 'POST']);

      middleware(req as any, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject disallowed method', () => {
      const req = mockRequest();
      req.method = 'DELETE';
      const res = mockResponse();
      const next = mockNext();
      const middleware = ValidationMiddleware.validateMethod(['GET', 'POST']);

      middleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method DELETE not allowed',
        code: 'METHOD_NOT_ALLOWED',
        allowedMethods: ['GET', 'POST']
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
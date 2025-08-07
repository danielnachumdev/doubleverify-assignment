import { Request, Response, NextFunction } from 'express';
import { AccountValidator } from '../models/Account';

/**
 * Custom request interface to include validated parameters
 */
export interface ValidatedRequest extends Request {
  validatedAccountNumber?: string;
  validatedAmount?: number;
}

/**
 * Validation middleware functions for ATM API endpoints
 */
export class ValidationMiddleware {
  /**
   * Validates account number parameter in the URL
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static validateAccountNumber(req: ValidatedRequest, res: Response, next: NextFunction): void {
    const { account_number } = req.params;

    // Check if account number is provided
    if (!account_number) {
      res.status(400).json({
        error: 'Account number is required',
        code: 'MISSING_ACCOUNT_NUMBER'
      });
      return;
    }

    // Validate account number format
    if (!AccountValidator.isValidAccountNumber(account_number)) {
      res.status(400).json({
        error: 'Invalid account number format. Account number must be 6-12 digits.',
        code: 'INVALID_ACCOUNT_NUMBER',
        provided: account_number
      });
      return;
    }

    // Store validated account number for use in route handlers
    req.validatedAccountNumber = account_number.trim();
    next();
  }

  /**
   * Validates amount in request body for POST requests
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static validateAmount(req: ValidatedRequest, res: Response, next: NextFunction): void {
    const { amount } = req.body;

    // Check if amount is provided
    if (amount === undefined || amount === null) {
      res.status(400).json({
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      });
      return;
    }

    // Check if amount is a number
    if (typeof amount !== 'number') {
      res.status(400).json({
        error: 'Amount must be a number',
        code: 'INVALID_AMOUNT_TYPE',
        provided: typeof amount
      });
      return;
    }

    // Validate amount value
    if (!AccountValidator.isValidAmount(amount)) {
      res.status(400).json({
        error: 'Amount must be greater than zero and a valid number',
        code: 'INVALID_AMOUNT_VALUE',
        provided: amount
      });
      return;
    }

    // Store validated amount for use in route handlers
    req.validatedAmount = amount;
    next();
  }

  /**
   * Validates request body structure for POST requests
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static validateRequestBody(req: Request, res: Response, next: NextFunction): void {
    // Check if request has a body
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({
        error: 'Request body is required and must be a valid JSON object',
        code: 'INVALID_REQUEST_BODY'
      });
      return;
    }

    next();
  }

  /**
   * Validates that request body contains only expected fields
   * @param allowedFields - Array of allowed field names
   * @returns Middleware function
   */
  static validateAllowedFields(allowedFields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const bodyKeys = Object.keys(req.body);
      const unexpectedFields = bodyKeys.filter(key => !allowedFields.includes(key));

      if (unexpectedFields.length > 0) {
        res.status(400).json({
          error: 'Request contains unexpected fields',
          code: 'UNEXPECTED_FIELDS',
          unexpectedFields,
          allowedFields
        });
        return;
      }

      next();
    };
  }

  /**
   * Validates Content-Type header for POST requests
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static validateContentType(req: Request, res: Response, next: NextFunction): void {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        error: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE',
        provided: contentType || 'none'
      });
      return;
    }

    next();
  }

  /**
   * Combined validation middleware for transaction endpoints (withdraw/deposit)
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static validateTransaction(req: ValidatedRequest, res: Response, next: NextFunction): void {
    // Validate account number
    ValidationMiddleware.validateAccountNumber(req, res, (err?: any) => {
      if (err || res.headersSent) return;

      // Validate request body
      ValidationMiddleware.validateRequestBody(req, res, (err?: any) => {
        if (err || res.headersSent) return;

        // Validate amount
        ValidationMiddleware.validateAmount(req, res, (err?: any) => {
          if (err || res.headersSent) return;

          next();
        });
      });
    });
  }

  /**
   * Sanitizes and normalizes input data
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static sanitizeInput(req: ValidatedRequest, _res: Response, next: NextFunction): void {
    // Sanitize account number if present
    if (req.params['account_number']) {
      req.params['account_number'] = req.params['account_number'].trim();
    }

    // Sanitize amount if present in body
    if (req.body && typeof req.body.amount === 'number') {
      // Round to 2 decimal places to prevent floating point precision issues
      req.body.amount = Math.round(req.body.amount * 100) / 100;
    }

    next();
  }

  /**
   * Validates request method for specific endpoints
   * @param allowedMethods - Array of allowed HTTP methods
   * @returns Middleware function
   */
  static validateMethod(allowedMethods: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!allowedMethods.includes(req.method)) {
        res.status(405).json({
          error: `Method ${req.method} not allowed`,
          code: 'METHOD_NOT_ALLOWED',
          allowedMethods
        });
        return;
      }

      next();
    };
  }
}
import { Request, Response, NextFunction } from 'express';
import { AccountNotFoundError, InsufficientFundsError, InvalidAmountError } from '../services/AccountService';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
}

/**
 * Error handling middleware for ATM API
 */
export class ErrorHandlingMiddleware {
  /**
   * Main error handling middleware
   * @param error - The error object
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static handleError(error: any, req: Request, res: Response, next: NextFunction): void {
    // If response has already been sent, delegate to default Express error handler
    if (res.headersSent) {
      return next(error);
    }

    // Log the error for debugging
    ErrorHandlingMiddleware.logError(error, req);

    // Determine error type and create appropriate response
    const errorResponse = ErrorHandlingMiddleware.createErrorResponse(error, req);

    // Send error response
    res.status(errorResponse.statusCode).json({
      error: errorResponse.message,
      code: errorResponse.code,
      timestamp: errorResponse.timestamp,
      path: errorResponse.path,
      method: errorResponse.method,
      ...(errorResponse.details && { details: errorResponse.details })
    });
  }

  /**
   * Creates a standardized error response based on error type
   * @param error - The error object
   * @param req - Express request object
   * @returns Formatted error response
   */
  private static createErrorResponse(error: any, req: Request): {
    statusCode: number;
    message: string;
    code: string;
    timestamp: string;
    path: string;
    method: string;
    details?: any;
  } {
    const timestamp = new Date().toISOString();
    const path = req.originalUrl || req.url;
    const method = req.method;

    // Handle custom application errors
    if (error instanceof AccountNotFoundError) {
      return {
        statusCode: 404,
        message: error.message,
        code: 'ACCOUNT_NOT_FOUND',
        timestamp,
        path,
        method
      };
    }

    if (error instanceof InsufficientFundsError) {
      return {
        statusCode: 400,
        message: error.message,
        code: 'INSUFFICIENT_FUNDS',
        timestamp,
        path,
        method
      };
    }

    if (error instanceof InvalidAmountError) {
      return {
        statusCode: 400,
        message: error.message,
        code: 'INVALID_AMOUNT',
        timestamp,
        path,
        method
      };
    }

    // Handle validation errors (from express-validator or similar)
    if (error.name === 'ValidationError') {
      return {
        statusCode: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        timestamp,
        path,
        method,
        details: error.details || error.errors
      };
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && 'body' in error) {
      return {
        statusCode: 400,
        message: 'Invalid JSON format in request body',
        code: 'INVALID_JSON',
        timestamp,
        path,
        method
      };
    }

    // Handle MongoDB/Database errors (if applicable in future)
    if (error.name === 'MongoError' || error.name === 'CastError') {
      return {
        statusCode: 500,
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        timestamp,
        path,
        method
      };
    }

    // Handle rate limiting errors
    if (error.status === 429) {
      return {
        statusCode: 429,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp,
        path,
        method
      };
    }

    // Handle generic HTTP errors
    if (error.status || error.statusCode) {
      const statusCode = error.status || error.statusCode;
      return {
        statusCode,
        message: error.message || ErrorHandlingMiddleware.getDefaultMessage(statusCode),
        code: ErrorHandlingMiddleware.getErrorCode(statusCode),
        timestamp,
        path,
        method
      };
    }

    // Handle unexpected errors
    return {
      statusCode: 500,
      message: process.env['NODE_ENV'] === 'production' 
        ? 'Internal server error' 
        : error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp,
      path,
      method,
      ...(process.env['NODE_ENV'] !== 'production' && { details: error.stack })
    };
  }

  /**
   * Logs error information for debugging and monitoring
   * @param error - The error object
   * @param req - Express request object
   */
  private static logError(error: any, req: Request): void {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    console.error(`[${timestamp}] ERROR: ${error.message}`);
    console.error(`Request: ${method} ${url}`);
    console.error(`User-Agent: ${userAgent}`);
    console.error(`IP: ${ip}`);
    
    if (error.stack) {
      console.error(`Stack: ${error.stack}`);
    }

    // Log additional error details for debugging
    if (error.details) {
      console.error(`Details: ${JSON.stringify(error.details, null, 2)}`);
    }
  }

  /**
   * Gets default error message for HTTP status codes
   * @param statusCode - HTTP status code
   * @returns Default error message
   */
  private static getDefaultMessage(statusCode: number): string {
    const messages: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return messages[statusCode] || 'Unknown Error';
  }

  /**
   * Gets error code for HTTP status codes
   * @param statusCode - HTTP status code
   * @returns Error code
   */
  private static getErrorCode(statusCode: number): string {
    const codes: { [key: number]: string } = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Handles 404 Not Found errors for undefined routes
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static handleNotFound(req: Request, _res: Response, next: NextFunction): void {
    const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
    (error as any).status = 404;
    next(error);
  }

  /**
   * Handles async route errors by wrapping async functions
   * @param fn - Async function to wrap
   * @returns Wrapped function that catches async errors
   */
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Creates a custom error with status code
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Error code
   * @returns Custom error object
   */
  static createError(message: string, statusCode: number = 500, code?: string): Error {
    const error = new Error(message);
    (error as any).status = statusCode;
    (error as any).code = code || ErrorHandlingMiddleware.getErrorCode(statusCode);
    return error;
  }

  /**
   * Middleware to handle CORS errors
   * @param error - The error object
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static handleCorsError(error: any, _req: Request, _res: Response, next: NextFunction): void {
    if (error.message && error.message.includes('CORS')) {
      const corsError = ErrorHandlingMiddleware.createError(
        'Cross-Origin Resource Sharing (CORS) error',
        403,
        'CORS_ERROR'
      );
      return next(corsError);
    }
    next(error);
  }
}
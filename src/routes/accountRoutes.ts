import { Router, Response } from 'express';
import { AccountService } from '../services/AccountService';
import { ValidationMiddleware, ValidatedRequest } from '../middleware/ValidationMiddleware';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';

const router = Router();
const accountService = new AccountService();

/**
 * POST /accounts
 * Create a new account
 */
router.post(
  '/',
  ValidationMiddleware.validateContentType,
  ValidationMiddleware.validateRequestBody,
  ValidationMiddleware.validateAllowedFields(['account_number', 'initial_balance']),
  ValidationMiddleware.validateAccountCreation,
  ErrorHandlingMiddleware.asyncHandler(async (req: ValidatedRequest, res: Response): Promise<void> => {
    const accountNumber = req.validatedAccountNumber!;
    const initialBalance = req.validatedAmount!;
    
    try {
      // Create account through service
      const newAccount = accountService.createAccount(accountNumber, initialBalance);
      
      // Return successful response
      res.status(201).json({
        account_number: newAccount.account_number,
        balance: newAccount.balance,
        transaction: 'account_created',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      // Handle specific service errors
      if (error.name === 'AccountAlreadyExistsError') {
        res.status(400).json({
          error: error.message,
          code: 'ACCOUNT_ALREADY_EXISTS',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
        return;
      }
      
      if (error.message.includes('Invalid account number format')) {
        res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
        return;
      }
      
      // Re-throw other errors to be handled by global error handler
      throw error;
    }
  })
);

/**
 * GET /accounts/:account_number/balance
 * Retrieve the balance for a specific account
 */
router.get(
  '/:account_number/balance',
  ValidationMiddleware.validateAccountNumber,
  ErrorHandlingMiddleware.asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const accountNumber = req.validatedAccountNumber!;
    
    // Get account balance from service
    const account = accountService.getBalance(accountNumber);
    
    // Return successful response
    res.status(200).json({
      account_number: account.account_number,
      balance: account.balance
    });
  })
);

/**
 * POST /accounts/:account_number/withdraw
 * Withdraw money from a specific account
 */
router.post(
  '/:account_number/withdraw',
  ValidationMiddleware.validateAccountNumber,
  ValidationMiddleware.validateContentType,
  ValidationMiddleware.validateRequestBody,
  ValidationMiddleware.validateAllowedFields(['amount']),
  ValidationMiddleware.validateAmount,
  ErrorHandlingMiddleware.asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const accountNumber = req.validatedAccountNumber!;
    const amount = req.validatedAmount!;
    
    // Process withdrawal through service
    const updatedAccount = accountService.withdraw(accountNumber, amount);
    
    // Return successful response
    res.status(200).json({
      account_number: updatedAccount.account_number,
      balance: updatedAccount.balance,
      transaction: 'withdrawal',
      amount: amount
    });
  })
);

/**
 * POST /accounts/:account_number/deposit
 * Deposit money into a specific account
 */
router.post(
  '/:account_number/deposit',
  ValidationMiddleware.validateAccountNumber,
  ValidationMiddleware.validateContentType,
  ValidationMiddleware.validateRequestBody,
  ValidationMiddleware.validateAllowedFields(['amount']),
  ValidationMiddleware.validateAmount,
  ErrorHandlingMiddleware.asyncHandler(async (req: ValidatedRequest, res: Response) => {
    const accountNumber = req.validatedAccountNumber!;
    const amount = req.validatedAmount!;
    
    // Process deposit through service
    const updatedAccount = accountService.deposit(accountNumber, amount);
    
    // Return successful response
    res.status(200).json({
      account_number: updatedAccount.account_number,
      balance: updatedAccount.balance,
      transaction: 'deposit',
      amount: amount
    });
  })
);

export default router;
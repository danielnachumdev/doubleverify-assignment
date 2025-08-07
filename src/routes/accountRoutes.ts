import { Router, Response } from 'express';
import { AccountService } from '../services/AccountService';
import { ValidationMiddleware, ValidatedRequest } from '../middleware/ValidationMiddleware';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';

const router = Router();
const accountService = new AccountService();

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

export default router;
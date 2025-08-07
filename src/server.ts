import express, { Request, Response, Application } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT: number = parseInt(process.env['PORT'] || '3000');

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'OK',
    message: 'ATM System is running',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (_req: Request, res: Response): void => {
  res.json({
    message: 'ATM System API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      balance: 'GET /accounts/{account_number}/balance',
      withdraw: 'POST /accounts/{account_number}/withdraw',
      deposit: 'POST /accounts/{account_number}/deposit'
    }
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, (): void => {
    console.log(`ATM System server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
}

export default app;
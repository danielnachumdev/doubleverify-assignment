import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import accountRoutes from './routes/accountRoutes';
import { ErrorHandlingMiddleware } from './middleware/ErrorHandlingMiddleware';

// Environment configuration
interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  healthCheckPath: string;
  apiVersion: string;
}

const config: AppConfig = {
  port: parseInt(process.env['PORT'] || '3000'),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  corsOrigin: process.env['CORS_ORIGIN'] || '*',
  logLevel: process.env['LOG_LEVEL'] || 'info',
  healthCheckPath: process.env['HEALTH_CHECK_PATH'] || '/health',
  apiVersion: process.env['API_VERSION'] || '1.0.0'
};

const app: Application = express();

// Trust proxy for cloud deployment (Heroku, AWS, etc.)
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 200 // For legacy browser support
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (config.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Enhanced health check endpoint for cloud monitoring
app.get(config.healthCheckPath, (_req: Request, res: Response): void => {
  const healthCheck = {
    status: 'OK',
    message: 'ATM System is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };

  res.status(200).json(healthCheck);
});

// Readiness probe for Kubernetes/container orchestration
app.get('/ready', (_req: Request, res: Response): void => {
  // Add any readiness checks here (database connections, etc.)
  res.status(200).json({
    status: 'READY',
    timestamp: new Date().toISOString()
  });
});

// Liveness probe for Kubernetes/container orchestration
app.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString()
  });
});

// API information endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json({
    name: 'ATM System API',
    version: config.apiVersion,
    environment: config.nodeEnv,
    description: 'A simple ATM system with REST API for balance inquiry, withdrawal, and deposit operations',
    endpoints: {
      health: `GET ${config.healthCheckPath}`,
      ready: 'GET /ready',
      live: 'GET /live',
      balance: 'GET /accounts/{account_number}/balance',
      withdraw: 'POST /accounts/{account_number}/withdraw',
      deposit: 'POST /accounts/{account_number}/deposit'
    },
    documentation: {
      swagger: '/api-docs',
      postman: 'https://documenter.getpostman.com/view/atm-system'
    },
    support: {
      contact: 'support@atm-system.com',
      issues: 'https://github.com/atm-system/issues'
    }
  });
});

// API Routes
app.use('/accounts', accountRoutes);

// 404 handler for undefined routes
app.use(ErrorHandlingMiddleware.handleNotFound);

// Global error handler
app.use(ErrorHandlingMiddleware.handleError);

// Start server
const server = app.listen(config.port, (): void => {
  console.log(`🚀 ATM System server is running`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Port: ${config.port}`);
  console.log(`🏥 Health check: http://localhost:${config.port}${config.healthCheckPath}`);
  console.log(`📊 API info: http://localhost:${config.port}/`);

  if (config.nodeEnv === 'development') {
    console.log(`🔧 Development mode - CORS origin: ${config.corsOrigin}`);
  }
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Set a shorter timeout for development
  const shutdownTimeout = config.nodeEnv === 'development' ? 5000 : 30000;

  // Force shutdown after timeout
  const forceShutdownTimer = setTimeout(() => {
    console.error(`Forced shutdown after ${shutdownTimeout / 1000}s timeout`);
    process.exit(1);
  }, shutdownTimeout);

  // Close server gracefully
  server.close((err) => {
    clearTimeout(forceShutdownTimer);

    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('✅ Server closed successfully');
    process.exit(0);
  });
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
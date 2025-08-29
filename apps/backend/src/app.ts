console.log('Starting server initialization...');

import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'
import express, { Express, Request, Response, NextFunction } from 'express'

console.log('Imported core dependencies');

// Import routes
console.log('Importing routes...');
import { householdRouter } from './routes/householdRoutes'
import { listItemRouter } from './routes/listItemRoutes'
import { verificationRouter } from './routes/verificationRoute'
console.log('Routes imported');

const app: Express = express()
console.log('Express app created');

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// CORS configuration
console.log('Configuring CORS...');
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
console.log('CORS options:', corsOptions);
app.use(cors(corsOptions));
console.log('CORS configured');

app.use(express.json())

// Test routes - should work without authentication
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/routes', (req: Request, res: Response) => {
  const routes = app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    }))
  res.json(routes)
})

// Apply Clerk middleware
app.use('/api', clerkMiddleware())

// API routes
app.use('/api/households', householdRouter)
app.use('/api', listItemRouter)
app.use('/api/verification', verificationRouter)

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Hello World!',
    api: {
      health: '/api/health',
      routes: '/api/routes',
      households: '/api/households',
      verification: '/api/verification'
    }
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Start the server
const PORT = process.env.PORT || 3000;

// Only start the server if this file is run directly (not when imported as a module)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log(`- GET http://localhost:${PORT}/api/health`);
    console.log(`- GET http://localhost:${PORT}/api/routes`);
    console.log(`- All other /api routes are available under http://localhost:${PORT}/api`);
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
  });
}

export default app;

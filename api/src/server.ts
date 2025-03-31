import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import userRoutes from './routes/userRoutes';
import { jokeRoutes } from './routes/jokeRoutes';
import { bitRoutes } from './routes/bitRoutes';
import { libraryRoutes } from './routes/libraryRoutes';
import healthRoutes from './routes/healthRoutes';
import { auth } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './middleware/logger';
import { requestId } from './middleware/requestId';
import { checkVersion } from './middleware/versioning';
import { cache } from './middleware/cache';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Version configuration
const versionConfig = {
  minVersion: process.env.API_MIN_VERSION || '1.0.0',
  maxVersion: process.env.API_MAX_VERSION || '1.0.0'
};

// Cache configuration
const defaultCacheOptions = {
  expire: parseInt(process.env.REDIS_TTL || '300')
};

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(requestId);
app.use(logger);

// API Documentation
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FunnyMachine API Documentation'
};
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check routes (no rate limiting or versioning)
app.use('/health', healthRoutes);

// Apply rate limiting to all routes
app.use(rateLimiter());

// Apply versioning to all API routes
app.use(apiPrefix, checkVersion(versionConfig));

// Routes
app.use(`${apiPrefix}/users`, rateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }), userRoutes);

// Protected routes with caching
app.use(`${apiPrefix}/jokes`, auth, cache(defaultCacheOptions), jokeRoutes);
app.use(`${apiPrefix}/bits`, auth, cache(defaultCacheOptions), bitRoutes);

// Library structure route (read-only, might not need cache?)
app.use(`${apiPrefix}/library`, [auth, libraryRoutes]);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Error [${req.requestId}]:`, err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.requestId
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
}); 
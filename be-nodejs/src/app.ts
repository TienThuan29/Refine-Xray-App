import express from 'express';
import cors from 'cors';
import { config } from './configs/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import router from './web/routes/index.route';
import swaggerUi from 'swagger-ui-express';
import { specs } from './configs/swagger';
import logger, { morganStream } from './libs/logger';
const app = express();

app.use(helmet());
app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);


app.use(compression());

// HTTP request logging
if (config.NODE_ENV === 'development' || config.NODE_ENV === 'dev') {
    app.use(morgan('combined', { stream: morganStream }));
} 
else {
    app.use(morgan('combined'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log application startup
logger.info(`Server starting in ${config.NODE_ENV} mode`);
logger.info(`Log level: ${config.LOG_LEVEL}`);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation',
}));

// Routes
app.use('/api/v1', router);

// // Error handling
// app.use('*', notFound);
// app.use(errorHandler);

export default app;
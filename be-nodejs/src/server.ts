import app from './app';
import { config } from './configs/config';
import logger from './libs/logger';


const startServer = async (): Promise<void> => {
      try {
            const server = app.listen(config.PORT, () => {
                  logger.info(`Server is running in ${config.NODE_ENV} mode on port ${config.PORT}`);
            });

            const gracefulShutdown = (signal: string) => {
                  logger.info(`Received ${signal}. Starting graceful shutdown...`);
                  server.close(() => {
                        logger.info('Server closed');
                        process.exit(0);
                  });
            };

            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      }
      catch(error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
      }
}

startServer();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import knex from 'knex';
import { logger } from './utils/logger';
import knexConfig from "../knexfile";
import { callingRouter } from './routes/interviewRoutes';
import { setupQueueProcessing } from './services/BlandAIService';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

export const db = knex(knexConfig.development);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is healthy', timeStamp: new Date() });
});

app.use('/api', callingRouter);
// https://d513-27-0-217-55.ngrok-free.app
// https://eoict3a33ptxtwr.m.pipedream.net
// Error handling middleware
app.use(errorHandler);

// Initialize queue processing
setupQueueProcessing();
logger.info('Queue processing initialized');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;

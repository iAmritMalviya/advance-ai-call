import { Router } from 'express';
import { Knex } from 'knex';
import { callCandidates, getInterviewResults, handleCallWebhook } from '../controllers/InterviewController';

export const callingRouter = Router();

callingRouter.post('/calls', callCandidates);

callingRouter.post('/webhook', handleCallWebhook);

callingRouter.get('/results/:sessionId',getInterviewResults);


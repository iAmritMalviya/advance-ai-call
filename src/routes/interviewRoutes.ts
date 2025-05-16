import { Router } from 'express';
import { Knex } from 'knex';
import {  getInterviewResults, handleCallWebhook, testQueueController, callCandidates } from '../controllers/InterviewController';

export const callingRouter = Router();

callingRouter.post('/calls', callCandidates);

callingRouter.post('/webhook', handleCallWebhook);

callingRouter.get('/results/:roundId',getInterviewResults);

callingRouter.post('/test', testQueueController);
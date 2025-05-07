import { Router } from 'express';
import { Knex } from 'knex';
import { createInterviewController } from '../controllers/InterviewController';

export const createInterviewRoutes = (db: Knex): Router => {
    const router = Router();
    const interviewController = createInterviewController(db);

    // Schedule interviews for selected candidates
    router.post('/schedule', interviewController.scheduleInterviews);

    // Webhook endpoint for Bland.ai call status updates
    router.post('/webhook', interviewController.handleCallWebhook);

    // Get interview results for a specific session
    router.get('/results/:sessionId', interviewController.getInterviewResults);

    return router;
}; 
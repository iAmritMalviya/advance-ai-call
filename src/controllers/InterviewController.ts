import { Request, Response } from 'express';
import { Candidate, InterviewRound, ICallAttempt, IQuestion, IBlandAIPostCallResponse } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import { questions, blandAIPostCallResponse } from "../dummyData";
import { initiateCallForCandidate, setupQueueProcessing, postCallEvaluationQueue, callCandidatesQueue } from '../services/BlandAIService';
import { findCandidatesByIds } from '../services/DatabaseService';
import { asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const scheduleInterviewSchema = z.object({
    candidateIds: z.array(z.number()).min(1, 'At least one candidate ID is required')
});

const getInterviewResultsSchema = z.object({
    roundId: z.string().uuid('Invalid round ID format')
});

export const callCandidates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { candidateIds } = scheduleInterviewSchema.parse(req.body);
    
    logger.info('Scheduling interviews', { candidateIds });

    const candidates = await findCandidatesByIds(candidateIds);

    if (candidates.length !== candidateIds.length) {
        const foundIds = candidates.map(c => c.id);
        const missingIds = candidateIds.filter(id => !foundIds.includes(id));
        throw new Error(`Candidates not found: ${missingIds.join(', ')}`);
    }

    // const results = await Promise.allSettled(
        candidates.map(candidate => callCandidatesQueue({candidate, questions}))
    // );

    // const failures = results.filter((result): result is PromiseRejectedResult => 
    //     result.status === 'rejected'
    // );

    // if (failures.length > 0) {
    //     logger.warn('Some interviews failed to schedule', { 
    //         failures: failures.map(f => f.reason)
    //     });
    // }

    res.status(200).json({ 
        message: 'Interviews scheduled successfully',
        total: candidates.length,
        // successful: candidates.length - failures.length,
        // failed: failures.length
    });
});

export const handleCallWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const webhookData: IBlandAIPostCallResponse = req.body;
    
    logger.info('Received webhook', { 
        // callId: webhookData.event.body.call_id 
        body: req.body
    });

    await postCallEvaluationQueue(webhookData);
    
    res.status(200).json({ message: 'Webhook processed successfully' });
});

export const getInterviewResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // const { roundId } = getInterviewResultsSchema.parse(req.params);

    logger.info('Fetching interview results');

    const results = await db('ai_call_evaluations')
        .join('call_attempts', 'ai_call_evaluations.callAttemptId', 'call_attempts.id')
        .join('candidates', 'call_attempts.candidateId', 'candidates.id')
        // .where('call_attempts.roundId', roundId)
        .select([
            'ai_call_evaluations.*',
            'candidates.name as candidateName',
            'candidates.phoneNumber',
            'call_attempts.status as callStatus',
            'call_attempts.startedAt',
            'call_attempts.endedAt'
        ]);

    if (!results.length) {
        res.status(404).json({ 
            error: 'No results found for this round' 
        });
        return;
    }

    res.status(200).json(results);
});

export const testQueueController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Testing queue with sample data');
    const testJob = await postCallEvaluationQueue(blandAIPostCallResponse as unknown as IBlandAIPostCallResponse);
    res.status(200).json({ 
        message: 'Test job added to queue successfully',
        jobId: testJob.id 
    });
});


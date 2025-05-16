import { Request, Response } from 'express';
import { Candidate, InterviewSession, ICallAttempt, IQuestion, IBlandAIPostCallResponse } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import { questions, blandAIPostCallResponse } from "../dummyData";
import { initiateCallForCandidate, setupQueueProcessing, testQueue } from '../services/BlandAIService';
import { z } from 'zod';

const scheduleInterviewSchema = z.object({
    candidateIds: z.array(z.number()).min(1, 'At least one candidate ID is required')
});

const getInterviewResultsSchema = z.object({
    sessionId: z.string().uuid('Invalid session ID format')
});

export const callCandidates = async (req: Request, res: Response): Promise<void> => {
        try {
            const { candidateIds } = scheduleInterviewSchema.parse(req.body);
            
            logger.info('Scheduling interviews', { candidateIds });

            const candidates = await db<Candidate>('candidates')
                .whereIn('id', candidateIds)
                .select('*');

            if (candidates.length !== candidateIds.length) {
                const foundIds = candidates.map(c => c.id);
                const missingIds = candidateIds.filter(id => !foundIds.includes(id));
                throw new Error(`Candidates not found: ${missingIds.join(', ')}`);
            }

            const results = await Promise.allSettled(
                candidates.map(candidate => initiateCallForCandidate(candidate, questions))
            );

            const failures = results.filter((result): result is PromiseRejectedResult => 
                result.status === 'rejected'
            );

            if (failures.length > 0) {
                logger.warn('Some interviews failed to schedule', { 
                    failures: failures.map(f => f.reason)
                });
            }

            res.status(200).json({ 
                message: 'Interviews scheduled successfully',
                total: candidates.length,
                successful: candidates.length - failures.length,
                failed: failures.length
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                logger.warn('Invalid request data', { errors: error.errors });
                res.status(400).json({ 
                    error: 'Invalid request data',
                    details: error.errors 
                });
                return;
            }

            logger.error('Error scheduling interviews:', error);
            res.status(500).json({ 
                error: 'Failed to schedule interviews',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

export const handleCallWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const webhookData: IBlandAIPostCallResponse = req.body;
            
            logger.info('Received webhook', { 
                callId: webhookData.event.body.call_id 
            });

            await testQueue(webhookData);
            
            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            logger.error('Error processing webhook:', error);
            res.status(500).json({ 
                error: 'Failed to process webhook',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

export const getInterviewResults = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = getInterviewResultsSchema.parse(req.params);

            logger.info('Fetching interview results', { sessionId });

            const results = await db('ai_call_evaluations')
                .join('call_attempts', 'ai_call_evaluations.callAttemptId', 'call_attempts.id')
                .join('candidates', 'call_attempts.candidateId', 'candidates.id')
                .where('call_attempts.sessionId', sessionId)
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
                    error: 'No results found for this session' 
                });
                return;
            }

            res.status(200).json(results);
        } catch (error) {
            if (error instanceof z.ZodError) {
                logger.warn('Invalid request parameters', { errors: error.errors });
                res.status(400).json({ 
                    error: 'Invalid request parameters',
                    details: error.errors 
                });
                return;
            }

            logger.error('Error fetching interview results:', error);
            res.status(500).json({ 
                error: 'Failed to fetch interview results',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

export const testQueueController = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.info('Testing queue with sample data');
            const testJob = await testQueue(blandAIPostCallResponse);
            res.status(200).json({ 
                message: 'Test job added to queue successfully',
                jobId: testJob.id 
            });
        } catch (error) {
            logger.error('Error testing queue:', error);
            res.status(500).json({ 
                error: 'Failed to test queue',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };


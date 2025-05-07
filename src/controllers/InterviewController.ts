import { Request, Response } from 'express';
import { Knex } from 'knex';
import { blandAIService } from '../services/BlandAIService';
import { Candidate, Question, InterviewSession, CallAttempt } from '../types/interview';
import { logger } from '../utils/logger';

export const createInterviewController = (db: Knex) => {
    const createInterviewSession = async (candidateId: number): Promise<InterviewSession> => {
        const [session] = await db<InterviewSession>('interview_sessions')
            .insert({
                candidate_id: candidateId,
                status: 'scheduled',
                scheduled_time: new Date(),
                retry_count: 0,
                max_retries: 3
            })
            .returning('*');

        return session;
    };

    const initiateCallForCandidate = async (
        candidate: Candidate,
        questions: Question[],
        sessionId: number
    ): Promise<void> => {
        try {
            // Create call attempt record
            const [callAttempt] = await db<CallAttempt>('call_attempts')
                .insert({
                    interview_session_id: sessionId,
                    attempt_number: 1,
                    status: 'initiated',
                    started_at: new Date()
                })
                .returning('*');

            // Initiate call through Bland.ai
            const callResponse = await blandAIService.initiateCall(
                candidate.phone_number,
                questions
            );

            // Update call attempt with Bland.ai call ID
            await db<CallAttempt>('call_attempts')
                .where('id', callAttempt.id)
                .update({
                    call_id: callResponse.call_id,
                    status: 'in_progress'
                });
        } catch (error) {
            logger.error(`Error initiating call for candidate ${candidate.id}:`, error);
            throw error;
        }
    };

    const scheduleInterviews = async (req: Request, res: Response): Promise<void> => {
        try {
            const { candidateIds } = req.body;

            // Fetch candidates and their phone numbers
            const candidates = await db<Candidate>('candidates')
                .whereIn('id', candidateIds)
                .select('*');

            // Fetch active questions
            const questions = await db<Question>('questions')
                .where('is_active', true)
                .orderBy('order_index')
                .select('*');

            // Create interview sessions and initiate calls
            for (const candidate of candidates) {
                const interviewSession = await createInterviewSession(candidate.id);
                await initiateCallForCandidate(candidate, questions, interviewSession.id);
            }

            res.status(200).json({ message: 'Interviews scheduled successfully' });
        } catch (error) {
            logger.error('Error scheduling interviews:', error);
            res.status(500).json({ error: 'Failed to schedule interviews' });
        }
    };

    const handleCallWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const webhookData = req.body;
            await blandAIService.handleWebhook(webhookData);
            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            logger.error('Error processing webhook:', error);
            res.status(500).json({ error: 'Failed to process webhook' });
        }
    };

    const getInterviewResults = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params;

            const results = await db('responses')
                .join('call_attempts', 'responses.call_attempt_id', 'call_attempts.id')
                .join('questions', 'responses.question_id', 'questions.id')
                .where('call_attempts.interview_session_id', sessionId)
                .select(
                    'questions.question_text',
                    'responses.transcribed_answer',
                    'responses.emotion_analysis'
                );

            res.status(200).json(results);
        } catch (error) {
            logger.error('Error fetching interview results:', error);
            res.status(500).json({ error: 'Failed to fetch interview results' });
        }
    };

    return {
        scheduleInterviews,
        handleCallWebhook,
        getInterviewResults
    };
}; 
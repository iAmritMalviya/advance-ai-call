import { Request, Response } from 'express';
import { Knex } from 'knex';
import { blandAIService } from '../services/BlandAIService';
import { Candidate, InterviewSession, ICallAttempt, IQuestion, IBlandAIPostCallResponse } from '../types/interview';
import { logger } from '../utils/logger';
import { db } from '..';
import {questions, blandAIPostCallResponse} from "../dummyData";


    const initiateCallForCandidate = async (
        candidate: Candidate,
        questions: IQuestion[],
    ): Promise<void> => {
        const trx = await db.transaction();
        try {
            const [callAttempt] = await trx<ICallAttempt>('call_attempts')
            .insert({
                status: 'initiated',
                candidateId: candidate.id
            })
            .returning('*');
            console.log("🚀 ~ callAttempt:", callAttempt)

            const callResponse = await blandAIService.initiateCall(
                candidate.phoneNumber,
                {
                    companyName: candidate.company,
                    questions: questions,
                    name: candidate.name
                }
            );
            console.log("🚀 ~ callResponse:", callResponse)

            const updatedCallId = await trx<ICallAttempt>('call_attempts')
            .where('id', callAttempt.id)
            .update({
                callId: callResponse.call_id,
                status: 'in_progress'
            }).returning("*");

            console.log("🚀 ~ updatedCallId:", updatedCallId)
            await trx.commit()
        } catch (error) {
            await trx.rollback();
            logger.error(`Error initiating call for candidate ${candidate.id}:`, error);
            throw error;
        }
    };

    const callCandidates = async (req: Request, res: Response): Promise<void> => {
        try {
            const { candidateIds } = req.body;

            const candidates = await db<Candidate>('candidates')
            .whereIn('id', candidateIds)
            .select('*');
            console.log("🚀 ~ callCandidates ~ candidates:", candidates)

            for (const candidate of candidates) {
                await initiateCallForCandidate(candidate, questions);
            }

            res.status(200).json({ message: 'Interviews scheduled successfully' });
        } catch (error) {
            logger.error('Error scheduling interviews:', error);
            res.status(500).json({ error: 'Failed to schedule interviews' });
        }
    };

    const handleCallWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const webhookData: IBlandAIPostCallResponse = blandAIPostCallResponse;
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


export {
        callCandidates,
        handleCallWebhook,
        getInterviewResults
};
import { Request, Response } from 'express';
import { Knex } from 'knex';
import * as blandAIService from '../services/BlandAIService';
import { Candidate, InterviewSession, ICallAttempt, IQuestion, IBlandAIPostCallResponse } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import {questions, blandAIPostCallResponse} from "../dummyData";
import { initiateCallForCandidate } from '../services/BlandAIService';

export const callCandidates = async (req: Request, res: Response): Promise<void> => {
        try {
            const { candidateIds } = req.body;
            console.log("🚀 ~ callCandidates ~ candidateIds:", candidateIds)

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

export const handleCallWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const webhookData: IBlandAIPostCallResponse = blandAIPostCallResponse;
            await blandAIService.handleWebhook(webhookData);
            res.status(200).json({ message: 'Webhook processed successfully' });
        } catch (error) {
            logger.error('Error processing webhook:', error);
            res.status(500).json({ error: 'Failed to process webhook' });
        }
};

export const getInterviewResults = async (req: Request, res: Response): Promise<void> => {
        try {
            const { roundId } = req.params;

            // get api based on the round id, it should fetch data from ai call evolution table

            res.status(200).json();
        } catch (error) {
            logger.error('Error fetching interview results:', error);
            res.status(500).json({ error: 'Failed to fetch interview results' });
        }
};

export const testQueue = async (req: Request, res: Response): Promise<void> => {
    
}

import axios from 'axios';
import Bull from 'bull';
import { IBlandAIPreCallResponse, EmotionAnalysis, ICallScript, IQuestion, IBlandAIPostCallResponse, ICallAttempt, CallStatus, IAiCallEvaluations, Candidate } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import { analyzeResponse } from './openAIService';
import { generateCallScript } from '../utils/common';
import { v4 as uuidv4 } from 'uuid';

// Constants
const MAX_CONCURRENT_CALLS = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 60 * 60 * 1000; // 1 hour in milliseconds
const QUEUE_NAMES = {
    CALLS: 'bland-ai-calls',
    EVALUATION: 'ai-call-evaluation'
} as const;

const createCallQueue = () => {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        throw new Error('Redis configuration is missing');
    }

    return new Bull(QUEUE_NAMES.CALLS, {
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME
        },
        defaultJobOptions: {
            attempts: MAX_RETRIES,
            backoff: {
                type: 'exponential',
                delay: RETRY_DELAY_BASE
            },
            removeOnComplete: true,
            removeOnFail: false
        }
    });
};

const createAiCallEvaluationQueue = () => {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        throw new Error('Redis configuration is missing');
    }

    return new Bull(QUEUE_NAMES.EVALUATION, {
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME
        },
        defaultJobOptions: {
            attempts: MAX_RETRIES,
            backoff: {
                type: 'exponential',
                delay: RETRY_DELAY_BASE
            },
            removeOnComplete: true,
            removeOnFail: false
        }
    });
};

const calculateRetryDelay = (attemptNumber: number): number => {
    return RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
};

const blandAiApiKey = process.env.BLAND_AI_API_KEY || '';
const blandAiBaseUrl = process.env.BLAND_AI_BASE_URL || '';

if (!blandAiApiKey || !blandAiBaseUrl) {
    throw new Error('Bland AI configuration is missing');
}

const callQueue = createCallQueue();
const callEvaluationQueue = createAiCallEvaluationQueue();

export const setupQueueProcessing = () => {
    // callQueue.process(MAX_CONCURRENT_CALLS, async (job) => {
    //     const { candidateId, phoneNumber, questions, company, name } = job.data;
    //     try {
    //         logger.info(`Processing call for candidate ${candidateId}`, { jobId: job.id });
    //         const callResponse = await initiateCall(phoneNumber, { questions, companyName: company, name });
    //         logger.info(`Call initiated successfully for candidate ${candidateId}`, { 
    //             jobId: job.id,
    //             callId: callResponse.call_id 
    //         });
    //         return callResponse;
    //     } catch (error) {
    //         logger.error(`Call failed for candidate ${candidateId}:`, { 
    //             error,
    //             jobId: job.id,
    //             attempt: job.attemptsMade
    //         });
    //         throw error;
    //     }
    // });

    callEvaluationQueue.process(MAX_CONCURRENT_CALLS, async (job) => {
        try {
            logger.info('Processing call evaluation', { jobId: job.id });
            await handleWebhook(job.data);
            logger.info('Call evaluation completed successfully', { jobId: job.id });
        } catch (error) {
            logger.error('Call evaluation failed:', { 
                error,
                jobId: job.id,
                attempt: job.attemptsMade
            });
            throw error;
        }
    });
};

export const initiateCall = async (phoneNumber: string, callScript: ICallScript): Promise<IBlandAIPreCallResponse> => {
    const { questions, name, companyName } = callScript;
    const callData = {
        phone_number: phoneNumber,
        task: generateCallScript({
            questions,
            companyName,
            name
        }),
        record: true,
        webhook_events: ["dynamic_data"],
        webhook: "https://8bcc-27-0-217-55.ngrok-free.app/api/webhook",
        metadata: {
            questions
        }
    };

    try {
        logger.info('Initiating call', { 
            phoneNumber,
            companyName,
            candidateName: name
        });

        const response = await axios.post<IBlandAIPreCallResponse>(
            `${blandAiBaseUrl}/calls`,
            callData,
            {
                headers: {
                    'Authorization': `Bearer ${blandAiApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Call initiated successfully', { 
            callId: response.data.call_id,
            phoneNumber
        });

        return response.data;
    } catch (error) {
        logger.error('Error initiating call:', { 
            error,
            phoneNumber,
            companyName
        });
        throw error;
    }
};

export const scheduleRetry = async (
        candidateId: number,
        phoneNumber: string,
        questions: IQuestion[],
        attemptNumber: number
    ): Promise<void> => {
        if (attemptNumber >= MAX_RETRIES) {
            logger.info(`Max retries reached for candidate ${candidateId}`);
            return;
        }

        const delay = calculateRetryDelay(attemptNumber);
        
        await callQueue.add(
            { candidateId, phoneNumber, questions },
            {
                delay,
                attempts: 1,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        );
    };

    // Process call results
const processCallResults = async (
        callId: string,
        transcript: string,
        emotionAnalysis: EmotionAnalysis
    ): Promise<void> => {
        // Implementation will depend on your database operations
        // This is where you'd store the results in your database
};

    // Handle failed call
const handleFailedCall = async (callId: string): Promise<void> => {
        // Implementation will depend on your database operations
        // This is where you'd handle retry logic
};

export const handleWebhook = async (data: IBlandAIPostCallResponse): Promise<void> => {
    console.log("🚀 ~ handleWebhook ~ data:", data)
    
    const callId = data.call_id;
    const callStartedAt = data.started_at;
    const callEndedAt = data.end_at;
    const status = data.status as CallStatus;
    const metaData = data.metadata as unknown as IQuestion[];
    const concatenatedTranscript = data.concatenated_transcript;

    const trx = await db.transaction();
    try {
        logger.info(`Processing webhook, ${ callId }`);

        await trx<ICallAttempt>('call_attempts').update({
            startedAt: new Date(callStartedAt),
            endedAt: new Date(callEndedAt),
            status
        }).where({
            callId
        });

        const callAttempt = await trx<ICallAttempt>('call_attempts')
            .select("*")
            .where({ callId })
            .first();

        if (!callAttempt) {
            throw new Error(`Call attempt not found for callId: ${callId}`);
        }

        const chatGPTResponse = await analyzeResponse(concatenatedTranscript, metaData);
        const { emotionalAnalysis, totalMatchScore, summary, notes } = chatGPTResponse;

        const aiCallEvaluation = await trx<IAiCallEvaluations>('ai_call_evaluations')
            .insert({
                id: uuidv4(),
                totalMatchScore,
                callAttemptId: callAttempt.id,
                finalDecision: summary.finalDecision,
                summaryReason: summary.reason,
                strengths: summary.strengths,
                weaknesses: summary.weaknesses,
                concatenatedTranscript,
                confidence: emotionalAnalysis.confidence,
                tone: emotionalAnalysis.tone,
                engagement: emotionalAnalysis.engagement,
                notes
            })
            .returning("*");

        logger.info('Webhook processed successfully', { 
            callId,
            evaluationId: aiCallEvaluation[0].id
        });

        await trx.commit();
    } catch (error) {
        await trx.rollback();
        logger.error(`Error processing webhook for call ${callId}:`, error);
        throw error;
    }
};

export const initiateCallForCandidate = async (
    candidate: Candidate,
    questions: IQuestion[],
): Promise<void> => {
    const trx = await db.transaction();
    try {
        logger.info('Initiating call for candidate', { 
            candidateId: candidate.id,
            name: candidate.name
        });

        const [callAttempt] = await trx<ICallAttempt>('call_attempts')
            .insert({
                status: 'initiated',
                candidateId: candidate.id
            })
            .returning('*');

        const callResponse = await initiateCall(
            candidate.phoneNumber,
            {
                companyName: candidate.company,
                questions: questions,
                name: candidate.name
            }
        );

        await trx<ICallAttempt>('call_attempts')
            .where('id', callAttempt.id)
            .update({
                callId: callResponse.call_id,
                status: 'in_progress'
            });

        logger.info('Call attempt created successfully', { 
            callAttemptId: callAttempt.id,
            callId: callResponse.call_id
        });

        await trx.commit();
    } catch (error) {
        await trx.rollback();
        logger.error(`Error initiating call for candidate ${candidate.id}:`, error);
        throw error;
    }
};

export const postCallEvaluationQueue = async (blandAIPostCallResponse: IBlandAIPostCallResponse): Promise<Bull.Job> => {
    try {
        logger.info('Adding test job to evaluation queue');
        const queue = await callEvaluationQueue.add(blandAIPostCallResponse);
        logger.info('Test job added successfully', { jobId: queue.id });
        return queue;
    } catch (error) {
        logger.error('Error testing queue:', error);
        throw error;
    }
};



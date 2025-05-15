import axios from 'axios';
import Bull from 'bull';
import { IBlandAIPreCallResponse, EmotionAnalysis, ICallScript, IQuestion, IBlandAIPostCallResponse, ICallAttempt, CallStatus, IAiCallEvaluations } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import { analyzeResponse } from './openAIService';
import { generateCallScript } from '../utils/common';
import { v4 as uuidv4 } from 'uuid';

// Constants
const MAX_CONCURRENT_CALLS = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 60 * 60 * 1000; // 1 hour in milliseconds


const createCallQueue = () => {
    return new Bull('bland-ai-calls', {
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME
        }
    });
};


const calculateRetryDelay = (attemptNumber: number): number => {
    return RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
};

    const blandAiApiKey = process.env.BLAND_AI_API_KEY || '';
    const blandAiBaseUrl = process.env.BLAND_AI_BASE_URL || '';
    console.log("🚀 ~ createBlandAIService ~ blandAiBaseUrl:", blandAiBaseUrl, blandAiApiKey)
    const callQueue = createCallQueue();

export const setupQueueProcessing = () => {
        callQueue.process(MAX_CONCURRENT_CALLS, async (job) => {
            console.log("🚀 ~ callQueue.process ~ job:", job)
            const { candidateId, phoneNumber, questions, company, name } = job.data;
            try {
                const callResponse = await initiateCall(phoneNumber,{ questions, companyName: company, name});
                return callResponse;
            } catch (error) {
                logger.error(`Call failed for candidate ${candidateId}:`, error);
                throw error;
            }
        });
};

export const initiateCall = async (phoneNumber: string, callScript: ICallScript): Promise<IBlandAIPreCallResponse> => {
        const {questions, name, companyName} = callScript;
        const callData = {
            phone_number: phoneNumber,
            task: generateCallScript({
                questions,
                companyName,
                name
            }),
            record:true,
            "webhook_events": [
                "dynamic_data"
            ],
            webhook: "https://eoict3a33ptxtwr.m.pipedream.net",
            metadata: {
                questions
            }
        };
        console.log("🚀 ~ initiateCall ~ callData:", callData)

        try {
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
            console.log("🚀 ~ initiateCall ~ response:", response)

            return response.data;
            return " " as unknown as IBlandAIPreCallResponse
        } catch (error) {
            logger.error('Error initiating call:', error);
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
        const callId = data.event.body.call_id;
        const callStartedAt = data.event.body.started_at;
        const callEndedAt = data.event.body.end_at;
        const status = data.event.body.status as CallStatus;
        const metaData = data.event.body.metadata as unknown as IQuestion[];
        const concatenatedTranscript = data.event.body.concatenated_transcript;
        console
        const trx = await db.transaction();
        try {
            // chat gpt and make the response
            // create score and upload to database
            // create api to send to the recruiter
         
            
            await trx<ICallAttempt>('call_attempts').update({
                startedAt: new Date(callStartedAt),
                endedAt: new Date(callEndedAt),
                status
            }).where({
                callId
            });

            const callAttempt = await trx<ICallAttempt>('call_attempts').select("*").where({
                callId
            }).first();
            
            // get questions based on the round
            console.log("🚀 ~ callAttempt ~ callAttempt:", callAttempt);
            // analyze question with question and answers
            const chatGPTResponse = await analyzeResponse(concatenatedTranscript, metaData)
            console.log("🚀 ~ handleWebhook ~ chatGPTResponse:", chatGPTResponse);
            const {emotionalAnalysis, totalMatchScore, summary, answersEvaluation, notes} = chatGPTResponse;
            const aiCallEvaluation = await trx<IAiCallEvaluations>('ai_call_evaluations').insert({
                id: uuidv4(),
                totalMatchScore,
                callAttemptId: callAttempt?.id,
                finalDecision: summary.finalDecision,
                summaryReason: summary.reason,
                strengths: summary.strengths,
                weaknesses: summary.weaknesses,
                concatenatedTranscript,
                confidence: emotionalAnalysis.confidence,
                tone: emotionalAnalysis.tone,
                engagement: emotionalAnalysis.engagement,
                notes
            }).returning("*")
            console.log("🚀 ~ handleWebhook ~ aiCallEvaluation:", aiCallEvaluation)
            await trx.commit();
            return
        } catch (error) {
            await trx.rollback()
            throw error;
        }
};

    // Initialize queue processing
    // setupQueueProcessing();



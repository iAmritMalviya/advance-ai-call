import axios from 'axios';
import Bull from 'bull';
import { Question, BlandAICallResponse, EmotionAnalysis } from '../types/interview';
import { logger } from '../utils/logger';

// Constants
const MAX_CONCURRENT_CALLS = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 60 * 60 * 1000; // 1 hour in milliseconds

// Create queue instance
const createCallQueue = () => {
    return new Bull('bland-ai-calls', {
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || '6379')
        }
    });
};

// Generate call script from questions
const generateCallScript = (questions: Question[]): string => {
    return questions.map((q, index) => {
        return `Question ${index + 1}: ${q.question_text}
                Please wait for the candidate's response.
                Analyze the tone and emotion of the response.
                Move to the next question.`;
    }).join('\n\n');
};

// Calculate retry delay with exponential backoff
const calculateRetryDelay = (attemptNumber: number): number => {
    return RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
};

// Create BlandAI service
export const createBlandAIService = () => {
    const apiKey = process.env.BLAND_AI_API_KEY || '';
    const baseUrl = 'https://api.bland.ai/v1';
    const callQueue = createCallQueue();

    // Setup queue processing
    const setupQueueProcessing = () => {
        callQueue.process(MAX_CONCURRENT_CALLS, async (job) => {
            const { candidateId, phoneNumber, questions } = job.data;
            
            try {
                const callResponse = await initiateCall(phoneNumber, questions);
                return callResponse;
            } catch (error) {
                logger.error(`Call failed for candidate ${candidateId}:`, error);
                throw error;
            }
        });
    };

    // Initialize call
    const initiateCall = async (phoneNumber: string, questions: Question[]): Promise<BlandAICallResponse> => {
        const callData = {
            phone_number: phoneNumber,
            task: generateCallScript(questions),
            voice_id: process.env.BLAND_AI_VOICE_ID,
            temperature: 0.7,
            webhook_url: `${process.env.API_BASE_URL}/webhooks/call-status`,
            metadata: {
                questions
            }
        };

        try {
            const response = await axios.post<BlandAICallResponse>(
                `${baseUrl}/calls`,
                callData,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Error initiating call:', error);
            throw error;
        }
    };

    // Schedule retry
    const scheduleRetry = async (
        candidateId: number,
        phoneNumber: string,
        questions: Question[],
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

    // Handle webhook
    const handleWebhook = async (data: BlandAICallResponse): Promise<void> => {
        const { call_id, status, transcript, emotion_analysis } = data;

        try {
            if (status === 'completed' && transcript && emotion_analysis) {
                await processCallResults(call_id, transcript, emotion_analysis);
            } else if (status === 'failed') {
                await handleFailedCall(call_id);
            }
        } catch (error) {
            logger.error(`Error processing webhook for call ${call_id}:`, error);
            throw error;
        }
    };

    // Initialize queue processing
    setupQueueProcessing();

    return {
        initiateCall,
        scheduleRetry,
        handleWebhook
    };
};

// Create and export a singleton instance
export const blandAIService = createBlandAIService(); 
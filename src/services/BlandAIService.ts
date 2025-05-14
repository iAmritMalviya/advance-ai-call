import axios from 'axios';
import Bull from 'bull';
import { IBlandAIPreCallResponse, EmotionAnalysis, ICallScript, IQuestion, IBlandAIPostCallResponse, ICallAttempt } from '../types/interview';
import { logger } from '../utils/logger';
import { db } from '..';

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

const generateCallScript = (payload: ICallScript): string => {
    const {questions, companyName, name} = payload
    const questionText =  questions.map((q, index) => {
        return `
        Question ${index + 1}: ${q.questionText}, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.`;
    }).join('');

    const task  = `You are Arun, an AI calling assistant at ${companyName}, reaching out to job candidate on behalf of our hiring team. Candidate name is ${name}, Your role is to conduct a short pre-screening call to understand how serious and interested the candidate is in the role.  You will ask a set of predefined questions given below. These questions help assess basic qualifications, availability, and motivation.  As the candidate responds, you will: interested and fit the candidate is.  If the candidate asks you questions outside your scope, politely let them know someone from our team will follow up.  
        📌 Do not read the questions like a script. ✅ Instead, sound conversational. For example, instead of saying:  “What is your notice period?” Say: “Just to check — are you available to start right away, or do you have a notice period?`
    return task.concat(questionText);
};

const calculateRetryDelay = (attemptNumber: number): number => {
    return RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1);
};

export const createBlandAIService = () => {
    const blandAiApiKey = process.env.BLAND_AI_API_KEY || '';
    const blandAiBaseUrl = process.env.BLAND_AI_BASE_URL || '';
    console.log("🚀 ~ createBlandAIService ~ blandAiBaseUrl:", blandAiBaseUrl, blandAiApiKey)
    const callQueue = createCallQueue();

    const setupQueueProcessing = () => {
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

    const initiateCall = async (phoneNumber: string, callScript: ICallScript): Promise<IBlandAIPreCallResponse> => {
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

    const scheduleRetry = async (
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

    // Handle webhook
    const handleWebhook = async (data: IBlandAIPostCallResponse): Promise<void> => {
        const callId = data.event.body.call_id;
        const callStartedAt = data.event.body.started_at;
        const callEndedAt = data.event.body.end_at;
        const status = data.event.body.status;
        const metaData = data.event.body.metadata;
        const trx = await db.transaction();
        try {
            // chat gpt and make the response
            // create score and upload to database
            // create api to send to the recruiter
            const callAttempt = trx<ICallAttempt>('call_attempts').select("*").where({
                callId
            });
            // get questions
            console.log("🚀 ~ callAttempt ~ callAttempt:", callAttempt);
            
        } catch (error) {
            logger.error(`Error processing webhook for call ${callId}:`, error);
            throw error;
        }
    };

    // Initialize queue processing
    // setupQueueProcessing();

    return {
        initiateCall,
        scheduleRetry,
        handleWebhook
    };
};

// Create and export a singleton instance
export const blandAIService = createBlandAIService(); 
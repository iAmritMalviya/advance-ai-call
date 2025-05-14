import OpenAI from 'openai';
import { IQuestion } from '../types/interview';
import { logger } from '../utils/logger';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface IExpectedAnswer {
    questionId: number;
    questionText: string;
    expectedAnswer: string;
    keyPoints: string[];
}

interface IResponseAnalysis {
    questionId: number;
    questionText: string;
    candidateResponse: string;
    expectedAnswer: string;
    matchScore: number;
    analysis: string;
    keyPointsCovered: string[];
    keyPointsMissed: string[];
}

export const generateExpectedAnswers = async (questions: IQuestion[]): Promise<IExpectedAnswer[]> => {
    try {
        const prompt = `Given the following interview questions, generate expected answers and key points that would indicate a strong candidate. Format the response as a JSON array of objects with the following structure:
        {
            "questionId": number,
            "questionText": string,
            "expectedAnswer": string,
            "keyPoints": string[]
        }

        Questions:
        ${questions.map(q => `${q.id}. ${q.questionText}`).join('\n')}

        For each question:
        1. Provide a comprehensive expected answer
        2. List 3-5 key points that should be covered
        3. Focus on professional, well-structured responses
        4. Consider industry best practices`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" }
        });

        const response = JSON.parse(completion.choices[0].message.content as string);
        return response.expectedAnswers;
    } catch (error) {
        logger.error('Error generating expected answers:', error);
        throw error;
    }
};

export const analyzeResponse = async (
    candidateResponse: string,
    expectedAnswer: IExpectedAnswer
): Promise<IResponseAnalysis> => {
    try {
        const prompt = `Analyze the candidate's response against the expected answer and key points. Format the response as a JSON object with the following structure:
        {
            "questionId": number,
            "questionText": string,
            "candidateResponse": string,
            "expectedAnswer": string,
            "matchScore": number,
            "analysis": string,
            "keyPointsCovered": string[],
            "keyPointsMissed": string[]
        }

        Candidate Response: ${candidateResponse}
        Expected Answer: ${expectedAnswer.expectedAnswer}
        Key Points: ${expectedAnswer.keyPoints.join(', ')}

        Provide:
        1. A match score (0-100)
        2. Detailed analysis of the response
        3. List of key points covered
        4. List of key points missed`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content as string);
    } catch (error) {
        logger.error('Error analyzing response:', error);
        throw error;
    }
};

export const calculateOverallMatchScore = (analyses: IResponseAnalysis[]): number => {
    const totalScore = analyses.reduce((sum, analysis) => sum + analysis.matchScore, 0);
    return Math.round(totalScore / analyses.length);
}; 
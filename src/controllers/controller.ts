import { Request, Response } from 'express';
import { Candidate, IBlandAIPostCallResponse } from '../types/common';
import { logger } from '../utils/logger';
import { db } from '..';
import { questions, blandAIPostCallResponse, postedJobs } from "../dummyData";
import { initiateCallForCandidate, testQueue } from '../services/BlandAIService';
import { z } from 'zod';
import { createHash } from 'crypto';
import { extractResumeData, getEmbedding } from '../services/openAIService';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parse } from 'path';
import { cosineSimilarity } from '../utils/cosine';
import { log } from 'console';

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

// Helper: Extract text from file (PDF/DOCX)
async function extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        return data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        return value;
    } else {
        throw new Error('Unsupported file type');
    }
}

// Helper: SHA256 hash
function sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
}

// Helper: Upload to S3 (stub)
async function uploadToS3(file: Express.Multer.File): Promise<string> {
    // TODO: Implement actual S3 upload
    return `s3://bucket/${file.originalname}`;
}

// Helper: Queue stub
const queue = {
    add: async (jobName: string, data: any) => ({ id: Math.random().toString(36).slice(2) })
};

export const parseResume = async(req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];
        console.log("🚀 ~ parseResume ~ files:", files)
        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }
        for (const file of files) {
            let rawText = '';
            try {
                rawText = await extractText(file);
                const resumeJson = await extractResumeData(rawText);
            } catch (err) {
                logger.warn('Failed to extract text from file', { file: file.originalname, error: err });
                continue;
            }
            const fileHash = sha256(rawText);
            console.log("🚀 ~ parseResume ~ fileHash:", fileHash)
            const existing = await db('resumes').where({ fileHash: fileHash }).first();
            if (existing) continue;
            console.log("🚀 ~ parseResume ~ existing:", existing)
            const embedding = await getEmbedding(rawText);
            const parsedResume = await db('resumes').insert({
                fileName: file.originalname,
                fileHash: fileHash,
                embedding: `[${embedding.join(',')}]`,
                extractedText: rawText
            }).returning("id");
            console.log("🚀 ~ parsedResume ~ parsedResume:", parsedResume)
        }
        res.status(202).json({  message: "Resumes received, processed, and saved" });
    } catch (error) {
        logger.error('Failed to parse resume', error);
        res.status(500).json({ 
            error: 'Failed to parse resume',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export const createJob = async(req: Request, res: Response): Promise<void> => {
    try {
        const job = JSON.stringify(postedJobs[0]);
        console.log("🚀 ~ createJob ~ job:", job)
        const embedding = await getEmbedding(job);
        const jobVector = await db('job_vectors').insert({
            embedding: `[${embedding.join(',')}]`
        }).returning('id');
        res.status(202).json({ jobVector, message: "Resumes received and queued for parsing" });
    } catch (error) {
        logger.error('Failed to to parse resume', error);
        res.status(500).json({ 
            error: 'Failed to to parse resume',
            message: error instanceof Error ? error.message : 'Unknown error'
        }); 
    }
}

export const getResumeJobMatching = async (req: Request, res: Response): Promise<void> => {
    try {
        const {jobId, resumeId} = req.body;
        const resume = await db('resumes').select("*").where({id: resumeId}).first();
        const job = await db('job_vectors').select("*").where({id: jobId}).first();
        const resumeEmbedding = JSON.parse(resume.embedding)
        const jobEmbedding = JSON.parse(job.embedding)
        const semantic = cosineSimilarity(resumeEmbedding, jobEmbedding) * 100;
        console.log("🚀 ~ getResumeJobMatching ~ semantic:", semantic)

        res.status(202).json({ resume ,job, message: "Resumes received and queued for parsing" });
        return
    } catch (error) {
        logger.error('Failed to to parse resume', error);
        res.status(500).json({ 
            error: 'Failed to to parse resume',
            message: error instanceof Error ? error.message : 'Unknown error'
        });    
    }
}
import { Router } from 'express';
import { Knex } from 'knex';
import {  getInterviewResults, handleCallWebhook, testQueueController, callCandidates, parseResume, createJob, getResumeJobMatching } from '../controllers/controller';
import multer from 'multer';
import path from 'path';

export const recruiterRouter = Router();

recruiterRouter.post('/calls', callCandidates);

recruiterRouter.post('/webhook', handleCallWebhook);

recruiterRouter.get('/results/:sessionId',getInterviewResults);

recruiterRouter.post('/test', testQueueController);

recruiterRouter.post('/job', createJob);

const storage = multer.memoryStorage();
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'));
  }
};
const upload = multer({ storage, fileFilter });

recruiterRouter.post('/upload', upload.array('files', 10), parseResume);

recruiterRouter.post('/matching', getResumeJobMatching);
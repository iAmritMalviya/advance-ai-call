export interface Candidate {
    id: number;
    name: string;
    phoneNumber: string;
    company: string;
    createdAt: Date;
    updatedAt: Date;
}


export interface InterviewRound {
    id: number;
    candidate_id: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
    scheduled_time: Date;
    retry_count: number;
    max_retries: number;
    created_at: Date;
    updated_at: Date;
}
export type CallStatus = 'initiated' | 'in_progress' | 'completed' | 'failed';
export interface ICallAttempt {
    id: number;
    status: CallStatus,
    callId?: string;
    candidateId: number,
    retryCount?: number,
    startedAt?: Date;
    endedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Response {
    id: number;
    callAttemptId: number;
    transcribedAnswer?: string;
    emotion_analysis?: EmotionAnalysis;
    created_at: Date;
}

export interface EmotionAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    emotions: {
        joy?: number;
        sadness?: number;
        anger?: number;
        fear?: number;
        surprise?: number;
    };
    confidence: number;
}

export interface IBlandAIPreCallResponse {
    call_id: string;
    status: string;
    transcript?: string;
    emotion_analysis?: EmotionAnalysis;
    metadata?: {
        questions: IQuestion[];
    };
} 

export interface IQuestion {
    id: number,
    questionText: string,
    expectation?: string
}

export interface ICallScript {
    questions: IQuestion[],
    companyName: string,
    name: string
}

export interface IBlandAIPostCallResponse {
      call_id: string;
      c_id: string;
      call_length: number;
      batch_id: string | null;
      to: string;
      from: string;
      completed: boolean;
      created_at: string;
      inbound: boolean;
      queue_status: string;
      max_duration: number;
      error_message: string | null;
      variables: {
        now: string;
        now_utc: string;
        short_from: string;
        short_to: string;
        from: string;
        to: string;
        call_id: string;
        phone_number: string;
        country: string;
        state: string;
        language: string;
        metadata: {
          questions: Array<{
            id: number;
            questionText: string;
            expectation: string;
          }>;
        };
        timestamp: string;
        timezone: string;
      };
      answered_by: string | null;
      record: boolean;
      recording_url: string;
      metadata: {
        questions: Array<{
          id: number;
          expectation: string;
          questionText: string;
        }>;
      };
      summary: string;
      price: number;
      started_at: string;
      local_dialing: boolean;
      call_ended_by: string;
      pathway_logs: any;
      analysis_schema: any;
      analysis: any;
      transferred_to: any;
      pathway_tags: any[];
      recording_expiration: any;
      status: string;
      pathway_id: any;
      warm_transfer_calls: any;
      concatenated_transcript: string;
      transcripts: Array<{
        id: number;
        user: string;
        text: string;
        created_at: string;
      }>;
      corrected_duration: string;
      end_at: string;
      disposition_tag: string;
  }


export interface IBlandAICallResponseEvaluation {
    answersEvaluation: IAnswersEvaluation[]; // if needed
    emotionalAnalysis: EmotionalAnalysis;
    totalMatchScore: number; // Out of 100
    summary: IEvaluationSummary;
    notes?: string
  }
  
  // in case if needed
  interface IAnswersEvaluation {
    id: number,
    question: string;
    matchScore: number; // Out of 10
    missedPoints: string[];
    wellAnsweredPoints: string[];
  }
  

export interface EmotionalAnalysis {
    confidence: 'Low' | 'Moderate' | 'High';
    tone: 'Negative' | 'Neutral' | 'Positive';
    engagement: 'Low' | 'Moderate' | 'High';
    notes?: string;
  }

  
export interface IEvaluationSummary {
    strengths: string[];
    weaknesses: string[];
    finalDecision: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';
    reason: string;
}

export interface IAiCallEvaluations extends EmotionalAnalysis {
  id: string;
  callAttemptId: number,
  totalMatchScore: number;           // out of 100
  finalDecision: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';
  concatenatedTranscript: string,
  summaryReason: string;
  strengths: string[];               // text[]
  weaknesses: string[];              // text[]
  createdAt: string;                 // ISO timestamp
  confidence: 'Low' | 'Moderate' | 'High';
  tone: 'Negative' | 'Neutral' | 'Positive';
  engagement: 'Low' | 'Moderate' | 'High';
  notes?: string;
}
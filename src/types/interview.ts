export interface Candidate {
    id: number;
    name: string;
    phone_number: string;
    email?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Question {
    id: number;
    question_text: string;
    order_index: number;
    is_active: boolean;
    created_at: Date;
}

export interface InterviewSession {
    id: number;
    candidate_id: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
    scheduled_time: Date;
    retry_count: number;
    max_retries: number;
    created_at: Date;
    updated_at: Date;
}

export interface CallAttempt {
    id: number;
    interview_session_id: number;
    attempt_number: number;
    status: 'initiated' | 'in_progress' | 'completed' | 'failed';
    call_id?: string;
    started_at?: Date;
    ended_at?: Date;
    created_at: Date;
}

export interface Response {
    id: number;
    call_attempt_id: number;
    question_id: number;
    transcribed_answer?: string;
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

export interface BlandAICallResponse {
    call_id: string;
    status: string;
    transcript?: string;
    emotion_analysis?: EmotionAnalysis;
    metadata?: {
        questions: Question[];
    };
} 
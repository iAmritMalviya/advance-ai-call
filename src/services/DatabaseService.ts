import { db } from '..';
import { Candidate, ICallAttempt, IAiCallEvaluations } from '../types/common';
import { logger } from '../utils/logger';
import { Knex } from 'knex';

export const withTransaction = async <T>(operation: (trx: Knex.Transaction) => Promise<T>): Promise<T> => {
    const trx = await db.transaction();
    try {
        const result = await operation(trx);
        await trx.commit();
        return result;
    } catch (error) {
        await trx.rollback();
        logger.error('Transaction failed:', error);
        throw error;
    }
};

export const findCandidatesByIds = async (candidateIds: number[]): Promise<Candidate[]> => {
    return db<Candidate>('candidates')
        .whereIn('id', candidateIds)
        .select('*');
};

export const createCallAttempt = async (trx: Knex.Transaction, candidateId: number): Promise<ICallAttempt> => {
    const [callAttempt] = await trx('call_attempts')
        .insert({
            status: 'initiated',
            candidateId
        })
        .returning('*');
    return callAttempt;
};

export const updateCallAttempt = async (
    trx: Knex.Transaction, 
    callAttemptId: number, 
    updates: Partial<ICallAttempt>
): Promise<void> => {
    await trx('call_attempts')
        .where('id', callAttemptId)
        .update(updates);
};

export const createAiCallEvaluation = async (
    trx: Knex.Transaction, 
    evaluation: Omit<IAiCallEvaluations, 'id'>
): Promise<IAiCallEvaluations> => {
    const [result] = await trx('ai_call_evaluations')
        .insert(evaluation)
        .returning('*');
    return result;
}; 
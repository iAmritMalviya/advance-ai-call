import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Candidates table
    await knex.schema.createTable('candidates', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('phone_number', 20).notNullable();
        table.string('email');
        table.timestamps(true, true);
    });

    // Questions table
    await knex.schema.createTable('questions', (table) => {
        table.increments('id').primary();
        table.text('question_text').notNullable();
        table.integer('order_index').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
    });

    // Interview sessions table
    await knex.schema.createTable('interview_sessions', (table) => {
        table.increments('id').primary();
        table.integer('candidate_id').references('id').inTable('candidates').onDelete('CASCADE');
        table.enum('status', ['scheduled', 'in_progress', 'completed', 'failed']).notNullable();
        table.timestamp('scheduled_time').notNullable();
        table.integer('retry_count').defaultTo(0);
        table.integer('max_retries').defaultTo(3);
        table.timestamps(true, true);
    });

    // Call attempts table
    await knex.schema.createTable('call_attempts', (table) => {
        table.increments('id').primary();
        table.integer('interview_session_id').references('id').inTable('interview_sessions').onDelete('CASCADE');
        table.integer('attempt_number').notNullable();
        table.enum('status', ['initiated', 'in_progress', 'completed', 'failed']).notNullable();
        table.string('call_id'); // Bland.ai call ID
        table.timestamp('started_at');
        table.timestamp('ended_at');
        table.timestamps(true, true);
    });

    // Responses table
    await knex.schema.createTable('responses', (table) => {
        table.increments('id').primary();
        table.integer('call_attempt_id').references('id').inTable('call_attempts').onDelete('CASCADE');
        table.integer('question_id').references('id').inTable('questions').onDelete('CASCADE');
        table.text('transcribed_answer');
        table.jsonb('emotion_analysis');
        table.timestamps(true, true);
    });

    // Create indexes
    await knex.schema.raw('CREATE INDEX idx_candidates_phone ON candidates(phone_number)');
    await knex.schema.raw('CREATE INDEX idx_interview_sessions_status ON interview_sessions(status)');
    await knex.schema.raw('CREATE INDEX idx_call_attempts_status ON call_attempts(status)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('responses');
    await knex.schema.dropTable('call_attempts');
    await knex.schema.dropTable('interview_sessions');
    await knex.schema.dropTable('questions');
    await knex.schema.dropTable('candidates');
} 
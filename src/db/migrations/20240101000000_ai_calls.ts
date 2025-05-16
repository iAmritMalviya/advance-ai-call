import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('candidates', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('phoneNumber', 20).notNullable();
        table.string('company');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
        table.timestamps(true, true);
    }).then(() => {
        return knex('candidates').insert([
            {
                "name": "Amrit Malviya",
                "phoneNumber": "+918107711622",
                "company": "arc"
              },
              {
                "name": "Roy",
                "phoneNumber": "+918617766165",
                "company": "arc"
              },
              {
                "name": "Dev",
                "phoneNumber": "+916284164462",
                "company": "Hr Agent io"
              }
        ])
    });

    // await knex.schema.createTable('rounds', (table) => {
    //     table.increments('id').primary();
    //     table.integer('candidate_id').references('id').inTable('candidates').onDelete('CASCADE');
    //     table.enum('status', ['scheduled', 'in_progress', 'completed', 'failed']).notNullable();
    //     table.timestamp('scheduled_time').notNullable();
    //     table.integer('retry_count').defaultTo(0);
    //     table.integer('max_retries').defaultTo(3);
    //     table.timestamp('createdAt').defaultTo(knex.fn.now());
    //     table.timestamp('updatedAt').defaultTo(knex.fn.now());
    // });

    await knex.schema.createTable('call_attempts', (table) => {
        table.increments('id').primary();
        table.enum('status', ['initiated', 'in_progress', 'completed', 'failed']).notNullable();
        table.string('callId'); 
        table.integer('candidateId').references('id').inTable('candidates').onDelete('CASCADE');
        // table.integer('roundId').references('id').inTable('rounds').onDelete('CASCADE');
        table.integer('retryCount').defaultTo(0);
        table.timestamp('startedAt').nullable();
        table.timestamp('endedAt').nullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });



    await knex.schema.createTable('ai_call_evaluations', (table) => {
        table.uuid('id').primary();
        table.integer('totalMatchScore').notNullable(); // Out of 100
        table.integer('callAttemptId').references('id').inTable('call_attempts').onDelete('CASCADE');
        table.text('finalDecision').notNullable(); // 'Strong Fit' | 'Moderate Fit' | 'Weak Fit'
        table.text('summaryReason').notNullable();
        table.specificType('strengths', 'text[]').notNullable();
        table.specificType('weaknesses', 'text[]').notNullable();
        table.text('concatenatedTranscript').notNullable();
        table.enu('confidence', ['Low', 'Moderate', 'High']).notNullable();
        table.enu('tone', ['Negative', 'Neutral', 'Positive']).notNullable();
        table.enu('engagement', ['Low', 'Moderate', 'High']).notNullable();
        table.text('notes');
        table.timestamp('createdAt').defaultTo(knex.fn.now());
      });
}

export async function down(knex: Knex): Promise<void> {
    // Drop tables in reverse order of their dependencies
    await knex.schema.dropTable('ai_call_evaluations');
    await knex.schema.dropTable('call_attempts');
    await knex.schema.dropTable('candidates');
} 





    // await knex.schema.createTable('questions', (table) => {
    //     table.increments('id').primary();
    //     table.text('question_text').notNullable();
    //     table.integer('order_index').notNullable();
    //     table.boolean('is_active').defaultTo(true);
    //     table.timestamps(true, true);
    // });



    // await knex.schema.createTable('responses', (table) => {
    //     table.increments('id').primary();
    //     table.integer('callAttemptId').references('id').inTable('call_attempts').onDelete('CASCADE');
    //     table.text('transcribedAnswer');
    //     table.integer('matchingScore')
    //     table.timestamp('createdAt').defaultTo(knex.fn.now());
    //     table.timestamp('updatedAt').defaultTo(knex.fn.now());
    // });
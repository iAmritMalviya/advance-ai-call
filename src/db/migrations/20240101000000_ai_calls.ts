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
                "name": "Bhargav",
                "phoneNumber": "+17042227592",
                "company": "arc"
              },
              {
                "name": "Dev",
                "phoneNumber": "+916284164462",
                "company": "Hr Agent io"
              }
        ])
    });


    await knex.schema.createTable('call_attempts', (table) => {
        table.increments('id').primary();
        table.enum('status', ['initiated', 'in_progress', 'completed', 'failed']).notNullable();
        table.string('callId'); 
        table.integer('candidateId').references('id').inTable('candidates').onDelete('CASCADE');
        table.integer('retryCount').defaultTo(0);
        table.timestamp('startedAt').nullable();
        table.timestamp('endedAt').nullable();
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('responses', (table) => {
        table.increments('id').primary();
        table.integer('callAttemptId').references('id').inTable('call_attempts').onDelete('CASCADE');
        table.text('transcribedAnswer');
        table.integer('matchingScore')
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('responses');
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

    // await knex.schema.createTable('interview_sessions', (table) => {
    //     table.increments('id').primary();
    //     table.integer('candidate_id').references('id').inTable('candidates').onDelete('CASCADE');
    //     table.enum('status', ['scheduled', 'in_progress', 'completed', 'failed']).notNullable();
    //     table.timestamp('scheduled_time').notNullable();
    //     table.integer('retry_count').defaultTo(0);
    //     table.integer('max_retries').defaultTo(3);
    //     table.timestamps(true, true);
    // });

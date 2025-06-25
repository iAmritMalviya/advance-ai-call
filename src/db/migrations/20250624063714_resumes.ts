import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('resumes', (table) => {
        table.increments('id').primary();
        table.integer('candidateId')
        table.text('rawText')
        table.string('fileName')
        table.text('fileHash')
        table.text('extractedText')
        table.specificType('embedding', 'vector(1536)').notNullable();
        table.string('originalFileUrl')
        table.jsonb('parsed');
        table.enu('parserType', ['rule', 'ai', 'fallback'])
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
        table.timestamps(true, true);
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('resumes');
}


import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'amrit',
        password: process.env.DB_PASSWORD || 'secret',
        database: process.env.DB_NAME || 'bland_ai'
    },
    migrations:{
      directory: "src/db/migrations"
    },
    pool: {
        min: 2,
        max: 10
    }
}
};

module.exports = config;
export default config
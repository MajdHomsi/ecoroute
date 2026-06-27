const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

// Allow disabling SSL locally by setting DB_SSL=false
if (process.env.DB_SSL !== 'false' && process.env.DATABASE_URL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool(poolConfig);

  if (process.env.NODE_ENV !== 'test') {
    pool.connect((err) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
      } else {
        console.log('✅ Connected to PostgreSQL');
      }
    });
  }
} else {
  pool = {
    query: () => Promise.reject(new Error('DATABASE_URL is not set')),
    connect: () => Promise.reject(new Error('DATABASE_URL is not set')),
  };
}

module.exports = pool;

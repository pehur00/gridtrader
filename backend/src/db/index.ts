import { Pool, QueryResult } from 'pg';

// Simple PostgreSQL connection pool (lazy initialization)
let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'gridtrader',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

// Simple query helper
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const res = await getPool().query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

// Transaction helper
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Get a client from the pool for manual control
export const getClient = () => getPool().connect();

// Close all connections (for graceful shutdown)
export const closePool = () => {
  if (pool) {
    return pool.end();
  }
};

export default getPool();

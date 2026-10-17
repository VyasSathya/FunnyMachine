import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface ExtendedPoolClient extends PoolClient {
  lastQuery?: string;
  queryWithTracking<R extends QueryResultRow = any>(text: string, values?: any[]): Promise<QueryResult<R>>;
}

const pool = new Pool({
  user: process.env.DB_USER || 'funnymachine',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'funnymachine',
  password: process.env.DB_PASSWORD || 'funnymachine',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

export async function getClient(): Promise<ExtendedPoolClient> {
  const client = await pool.connect() as ExtendedPoolClient;
  const timeout = setTimeout(() => {
    console.warn('Client has been checked out for more than 5 seconds!');
    console.warn('Last executed query:', client.lastQuery);
  }, 5000);

  const release = client.release;
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release.apply(client);
  };

  const query = client.query.bind(client);
  client.queryWithTracking = async function<R extends QueryResultRow = any>(text: string, values?: any[]): Promise<QueryResult<R>> {
    client.lastQuery = text;
    return query(text, values);
  };

  return client;
}

export default pool; 
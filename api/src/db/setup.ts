import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const pool = new Pool({
    user: process.env.DB_USER || 'funnymachine',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'funnymachine',
    password: process.env.DB_PASSWORD || 'funnymachine',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);
    console.log('Database schema setup completed successfully');
  } catch (error) {
    console.error('Error setting up database schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default setupDatabase; 
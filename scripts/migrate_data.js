const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection configuration
const pool = new Pool({
  user: 'funnymachine',
  host: 'localhost',
  database: 'funnymachine',
  password: 'funnymachine',
  port: 5432,
});

async function migrateData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Read the localStorage backup file
    const backupPath = path.join(__dirname, '../backup/localStorage_backup.json');
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

    // Migrate jokes
    if (backupData.jokes) {
      for (const joke of backupData.jokes) {
        const result = await client.query(
          `INSERT INTO jokes (id, text, created_at, updated_at, metadata)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE
           SET text = EXCLUDED.text,
               updated_at = EXCLUDED.updated_at,
               metadata = EXCLUDED.metadata`,
          [
            joke.id,
            joke.text,
            joke.created_at || new Date(),
            joke.updated_at || new Date(),
            joke.metadata || {}
          ]
        );
        console.log(`Migrated joke: ${joke.id}`);
      }
    }

    // Migrate bits
    if (backupData.bits) {
      for (const bit of backupData.bits) {
        const result = await client.query(
          `INSERT INTO bits (id, label, created_at, updated_at, metadata)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE
           SET label = EXCLUDED.label,
               updated_at = EXCLUDED.updated_at,
               metadata = EXCLUDED.metadata`,
          [
            bit.id,
            bit.label,
            bit.created_at || new Date(),
            bit.updated_at || new Date(),
            bit.metadata || {}
          ]
        );
        console.log(`Migrated bit: ${bit.id}`);

        // Migrate bit-joke relationships
        if (bit.jokes && bit.jokes.length > 0) {
          for (let i = 0; i < bit.jokes.length; i++) {
            const jokeRef = bit.jokes[i];
            await client.query(
              `INSERT INTO bit_jokes (bit_id, joke_id, order_index)
               VALUES ($1, $2, $3)
               ON CONFLICT (bit_id, joke_id) DO UPDATE
               SET order_index = EXCLUDED.order_index`,
              [bit.id, jokeRef.id, i]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Run migration
migrateData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 
import { getClient } from '../db';
import { Bit } from '../types/bit';

export class BitService {
  async createBit(bit: Omit<Bit, 'id' | 'created_at' | 'updated_at'>): Promise<Bit> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'INSERT INTO bits (title, description, user_id, label, metadata, is_archived) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [bit.title, bit.description, bit.user_id, bit.label, bit.metadata, bit.is_archived]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getBit(id: string): Promise<Bit | null> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'SELECT * FROM bits WHERE id = $1 AND is_archived = false',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateBit(id: string, bit: Partial<Bit>): Promise<Bit | null> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'UPDATE bits SET title = $1, description = $2, label = $3, metadata = $4, updated_at = NOW() WHERE id = $5 AND is_archived = false RETURNING *',
        [bit.title, bit.description, bit.label, bit.metadata, id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteBit(id: string): Promise<void> {
    const client = await getClient();
    try {
      await client.queryWithTracking(
        'UPDATE bits SET is_archived = true WHERE id = $1 RETURNING id',
        [id]
      );
    } finally {
      client.release();
    }
  }

  async getBitsByUser(userId: string): Promise<Bit[]> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'SELECT * FROM bits WHERE user_id = $1 AND is_archived = false ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async addJokeToBit(bitId: string, jokeId: string, orderIndex: number): Promise<void> {
    const client = await getClient();
    try {
      await client.queryWithTracking(
        `INSERT INTO bit_jokes (bit_id, joke_id, order_index)
         VALUES ($1, $2, $3)
         ON CONFLICT (bit_id, joke_id) DO UPDATE
         SET order_index = EXCLUDED.order_index`,
        [bitId, jokeId, orderIndex]
      );
    } finally {
      client.release();
    }
  }

  async removeJokeFromBit(bitId: string, jokeId: string): Promise<ApiResponse<void>> {
    const client = await getClient();
    try {
      const result = await (client as any).queryWithTracking(
        'DELETE FROM bit_jokes WHERE bit_id = $1 AND joke_id = $2',
        [bitId, jokeId]
      );
      
      if (result.rowCount === 0) {
        return { success: false, error: 'Joke not found in bit' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing joke from bit:', error);
      return { success: false, error: 'Failed to remove joke from bit' };
    } finally {
      client.release();
    }
  }
} 
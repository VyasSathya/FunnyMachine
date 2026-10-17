import { getClient } from '../db';
import { User } from '../types/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserService {
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await getClient();
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const result = await client.queryWithTracking(
        'INSERT INTO users (email, password, name, metadata, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userData.email, hashedPassword, userData.name, userData.metadata, userData.is_active]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUser(userId: string): Promise<User | null> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'UPDATE users SET name = $1, metadata = $2, updated_at = NOW() WHERE id = $3 AND is_active = true RETURNING *',
        [updateData.name, updateData.metadata, userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteUser(userId: string): Promise<User> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [userId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const client = await getClient();
    try {
      const result = await client.queryWithTracking(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      const user = result.rows[0];
      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return { user, token };
    } finally {
      client.release();
    }
  }
} 
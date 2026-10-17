import { Joke } from '../types/joke';
import { ApiResponse } from '../types/api';
import { DatabaseClient } from '../database/client';

export class JokeService {
  constructor(private db: DatabaseClient) {}

  async createJoke(jokeData: Partial<Joke>): Promise<ApiResponse<Joke>> {
    try {
      const joke = await this.db.jokes.create(jokeData);
      return {
        success: true,
        data: joke,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create joke',
      };
    }
  }

  async getJoke(id: string): Promise<ApiResponse<Joke>> {
    try {
      const joke = await this.db.jokes.findUnique({ where: { id } });
      if (!joke) {
        return {
          success: false,
          error: 'Joke not found',
        };
      }
      return {
        success: true,
        data: joke,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve joke',
      };
    }
  }

  async updateJoke(id: string, updateData: Partial<Joke>): Promise<ApiResponse<Joke>> {
    try {
      const joke = await this.db.jokes.update({
        where: { id },
        data: updateData,
      });
      if (!joke) {
        return {
          success: false,
          error: 'Joke not found',
        };
      }
      return {
        success: true,
        data: joke,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update joke',
      };
    }
  }

  async deleteJoke(id: string): Promise<ApiResponse<void>> {
    try {
      await this.db.jokes.delete({ where: { id } });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete joke',
      };
    }
  }

  async getJokesByBit(bitId: string): Promise<ApiResponse<Joke[]>> {
    try {
      const jokes = await this.db.jokes.findMany({
        where: { bit_id: bitId },
      });
      return {
        success: true,
        data: jokes,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve jokes',
      };
    }
  }
} 
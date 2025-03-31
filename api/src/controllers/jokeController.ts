import { Request, Response } from 'express';
import { JokeService } from '../services/jokeService';
import { ApiResponse } from '../types/api';
import { Joke } from '../types/joke';

export class JokeController {
  constructor(private jokeService: JokeService) {}

  async createJoke(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.jokeService.createJoke(req.body);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create joke',
      });
    }
  }

  async getJoke(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.jokeService.getJoke(req.params.id);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve joke',
      });
    }
  }

  async updateJoke(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.jokeService.updateJoke(req.params.id, req.body);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update joke',
      });
    }
  }

  async deleteJoke(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.jokeService.deleteJoke(req.params.id);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete joke',
      });
    }
  }

  async getJokesByBit(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.jokeService.getJokesByBit(req.params.bitId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve jokes',
      });
    }
  }
} 
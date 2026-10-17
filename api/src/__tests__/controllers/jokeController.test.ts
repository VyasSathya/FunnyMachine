import { Request, Response } from 'express';
import { JokeController } from '../../controllers/jokeController';
import { JokeService } from '../../services/jokeService';
import { Joke } from '../../types/joke';
import { ApiResponse } from '../../types/api';

// Mock JokeService
jest.mock('../../services/jokeService');

describe('JokeController', () => {
  let jokeController: JokeController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJokeService: jest.Mocked<JokeService>;

  beforeEach(() => {
    mockJokeService = new JokeService() as jest.Mocked<JokeService>;
    jokeController = new JokeController(mockJokeService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('createJoke', () => {
    it('should create a new joke successfully', async () => {
      const jokeData = {
        text: 'Test joke',
        bit_id: '123',
        user_id: '456',
        metadata: {},
        is_archived: false,
      };

      const createdJoke: Joke = {
        id: '789',
        ...jokeData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = jokeData;
      mockJokeService.createJoke.mockResolvedValue({ success: true, data: createdJoke });

      await jokeController.createJoke(mockRequest as Request, mockResponse as Response);

      expect(mockJokeService.createJoke).toHaveBeenCalledWith(jokeData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdJoke,
      });
    });

    it('should handle errors when creating a joke', async () => {
      const error = new Error('Database error');
      mockJokeService.createJoke.mockRejectedValue(error);

      await jokeController.createJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create joke',
      });
    });
  });

  describe('getJoke', () => {
    it('should retrieve a joke successfully', async () => {
      const joke: Joke = {
        id: '123',
        text: 'Test joke',
        bit_id: '456',
        user_id: '789',
        metadata: {},
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.params = { id: joke.id };
      mockJokeService.getJoke.mockResolvedValue({ success: true, data: joke });

      await jokeController.getJoke(mockRequest as Request, mockResponse as Response);

      expect(mockJokeService.getJoke).toHaveBeenCalledWith(joke.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: joke,
      });
    });

    it('should handle not found joke', async () => {
      mockRequest.params = { id: '123' };
      mockJokeService.getJoke.mockResolvedValue({ success: false, error: 'Joke not found' });

      await jokeController.getJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Joke not found',
      });
    });

    it('should handle errors when retrieving a joke', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: '123' };
      mockJokeService.getJoke.mockRejectedValue(error);

      await jokeController.getJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve joke',
      });
    });
  });

  describe('updateJoke', () => {
    it('should update a joke successfully', async () => {
      const jokeId = '123';
      const updateData = {
        text: 'Updated joke',
        metadata: { updated: true },
      };

      const updatedJoke: Joke = {
        id: jokeId,
        text: updateData.text,
        bit_id: '456',
        user_id: '789',
        metadata: updateData.metadata,
        is_archived: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.params = { id: jokeId };
      mockRequest.body = updateData;
      mockJokeService.updateJoke.mockResolvedValue({ success: true, data: updatedJoke });

      await jokeController.updateJoke(mockRequest as Request, mockResponse as Response);

      expect(mockJokeService.updateJoke).toHaveBeenCalledWith(jokeId, updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedJoke,
      });
    });

    it('should handle not found joke during update', async () => {
      mockRequest.params = { id: '123' };
      mockJokeService.updateJoke.mockResolvedValue({ success: false, error: 'Joke not found' });

      await jokeController.updateJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Joke not found',
      });
    });

    it('should handle errors when updating a joke', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: '123' };
      mockJokeService.updateJoke.mockRejectedValue(error);

      await jokeController.updateJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to update joke',
      });
    });
  });

  describe('deleteJoke', () => {
    it('should delete a joke successfully', async () => {
      const jokeId = '123';
      const deletedJoke: Joke = {
        id: jokeId,
        text: 'Test joke',
        bit_id: '456',
        user_id: '789',
        metadata: {},
        is_archived: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.params = { id: jokeId };
      mockJokeService.deleteJoke.mockResolvedValue({ success: true, data: undefined });

      await jokeController.deleteJoke(mockRequest as Request, mockResponse as Response);

      expect(mockJokeService.deleteJoke).toHaveBeenCalledWith(jokeId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
      });
    });

    it('should handle not found joke during deletion', async () => {
      mockRequest.params = { id: '123' };
      mockJokeService.deleteJoke.mockResolvedValue({ success: false, error: 'Joke not found' });

      await jokeController.deleteJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Joke not found',
      });
    });

    it('should handle errors when deleting a joke', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: '123' };
      mockJokeService.deleteJoke.mockRejectedValue(error);

      await jokeController.deleteJoke(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete joke',
      });
    });
  });

  describe('getJokesByBit', () => {
    it('should retrieve jokes for a bit successfully', async () => {
      const bitId = '123';
      const jokes: Joke[] = [
        {
          id: '1',
          text: 'Joke 1',
          bit_id: bitId,
          user_id: '456',
          metadata: {},
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          text: 'Joke 2',
          bit_id: bitId,
          user_id: '456',
          metadata: {},
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockRequest.params = { bitId };
      mockJokeService.getJokesByBit.mockResolvedValue({ success: true, data: jokes });

      await jokeController.getJokesByBit(mockRequest as Request, mockResponse as Response);

      expect(mockJokeService.getJokesByBit).toHaveBeenCalledWith(bitId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: jokes,
      });
    });

    it('should handle empty jokes list', async () => {
      mockRequest.params = { bitId: '123' };
      mockJokeService.getJokesByBit.mockResolvedValue({ success: true, data: [] });

      await jokeController.getJokesByBit(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should handle errors when retrieving jokes by bit', async () => {
      const error = new Error('Database error');
      mockRequest.params = { bitId: '123' };
      mockJokeService.getJokesByBit.mockRejectedValue(error);

      await jokeController.getJokesByBit(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve jokes',
      });
    });
  });
}); 
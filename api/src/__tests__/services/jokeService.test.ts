import { PoolClient } from 'pg';
import { JokeService } from '../../services/jokeService';
import { getClient } from '../../db';
import { Joke } from '../../types/joke';

// Mock the database client
jest.mock('../../db', () => ({
  getClient: jest.fn(),
}));

describe('JokeService', () => {
  let jokeService: JokeService;
  let mockClient: jest.Mocked<PoolClient & { queryWithTracking: jest.Mock }>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      queryWithTracking: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient & { queryWithTracking: jest.Mock }>;

    // Setup mock implementation
    (getClient as jest.Mock).mockResolvedValue(mockClient);

    jokeService = new JokeService();
  });

  describe('createJoke', () => {
    it('should create a new joke', async () => {
      const jokeData: Omit<Joke, 'id' | 'created_at' | 'updated_at'> = {
        text: 'Test joke',
        bit_id: '123',
        user_id: '456',
        metadata: {},
        is_archived: false,
      };

      const mockResult = {
        rows: [{
          id: '789',
          text: jokeData.text,
          bit_id: jokeData.bit_id,
          user_id: jokeData.user_id,
          metadata: jokeData.metadata,
          is_archived: jokeData.is_archived,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await jokeService.createJoke(jokeData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jokes'),
        expect.arrayContaining([jokeData.text, jokeData.bit_id, jokeData.user_id])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle errors when creating a joke', async () => {
      const jokeData: Omit<Joke, 'id' | 'created_at' | 'updated_at'> = {
        text: 'Test joke',
        bit_id: '123',
        user_id: '456',
        metadata: {},
        is_archived: false,
      };

      mockClient.queryWithTracking.mockRejectedValue(new Error('Database error'));

      await expect(jokeService.createJoke(jokeData)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getJoke', () => {
    it('should retrieve a joke by ID', async () => {
      const jokeId = '123';
      const mockResult = {
        rows: [{
          id: jokeId,
          text: 'Test joke',
          bit_id: '456',
          user_id: '789',
          metadata: {},
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await jokeService.getJoke(jokeId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM jokes'),
        expect.arrayContaining([jokeId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for non-existent joke', async () => {
      const jokeId = '123';
      mockClient.queryWithTracking.mockResolvedValue({ rows: [] });

      const result = await jokeService.getJoke(jokeId);

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateJoke', () => {
    it('should update an existing joke', async () => {
      const jokeId = '123';
      const updateData: Partial<Joke> = {
        text: 'Updated joke',
        metadata: { updated: true },
      };

      const mockResult = {
        rows: [{
          id: jokeId,
          text: updateData.text,
          bit_id: '456',
          user_id: '789',
          metadata: updateData.metadata,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await jokeService.updateJoke(jokeId, updateData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jokes'),
        expect.arrayContaining([updateData.text, jokeId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteJoke', () => {
    it('should mark a joke as archived', async () => {
      const jokeId = '123';
      const mockResult = {
        rows: [{
          id: jokeId,
          text: 'Test joke',
          bit_id: '456',
          user_id: '789',
          metadata: {},
          is_archived: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await jokeService.deleteJoke(jokeId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jokes SET is_archived'),
        expect.arrayContaining([jokeId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getJokesByBit', () => {
    it('should retrieve all jokes for a bit', async () => {
      const bitId = '123';
      const mockResult = {
        rows: [
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
            user_id: '789',
            metadata: {},
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await jokeService.getJokesByBit(bitId);

      expect(result).toEqual(mockResult.rows);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM jokes WHERE bit_id'),
        expect.arrayContaining([bitId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 
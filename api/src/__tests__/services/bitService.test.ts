import { PoolClient } from 'pg';
import { BitService } from '../../services/bitService';
import { getClient } from '../../db';
import { QueryResult } from 'pg';
import { Bit } from '../../types/bit';

// Mock the database client
jest.mock('../../db', () => ({
  getClient: jest.fn(),
}));

describe('BitService', () => {
  let bitService: BitService;
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

    bitService = new BitService();
  });

  describe('createBit', () => {
    it('should create a new bit', async () => {
      const bitData: Omit<Bit, 'id' | 'created_at' | 'updated_at'> = {
        title: 'Test Bit',
        description: 'Test Description',
        user_id: '123',
        metadata: {},
        is_archived: false,
      };

      const mockResult = {
        rows: [{
          id: '456',
          title: bitData.title,
          description: bitData.description,
          user_id: bitData.user_id,
          metadata: bitData.metadata,
          is_archived: bitData.is_archived,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await bitService.createBit(bitData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bits'),
        expect.arrayContaining([bitData.title, bitData.description, bitData.user_id])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle errors when creating a bit', async () => {
      const bitData: Omit<Bit, 'id' | 'created_at' | 'updated_at'> = {
        title: 'Test Bit',
        description: 'Test Description',
        user_id: '123',
        metadata: {},
        is_archived: false,
      };

      mockClient.queryWithTracking.mockRejectedValue(new Error('Database error'));

      await expect(bitService.createBit(bitData)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getBit', () => {
    it('should retrieve a bit by ID', async () => {
      const bitId = '123';
      const mockResult = {
        rows: [{
          id: bitId,
          title: 'Test Bit',
          description: 'Test Description',
          user_id: '456',
          metadata: {},
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await bitService.getBit(bitId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM bits'),
        expect.arrayContaining([bitId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for non-existent bit', async () => {
      const bitId = '123';
      mockClient.queryWithTracking.mockResolvedValue({ rows: [] });

      const result = await bitService.getBit(bitId);

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateBit', () => {
    it('should update an existing bit', async () => {
      const bitId = '123';
      const updateData: Partial<Bit> = {
        title: 'Updated Bit',
        description: 'Updated Description',
        metadata: { updated: true },
      };

      const mockResult = {
        rows: [{
          id: bitId,
          title: updateData.title,
          description: updateData.description,
          user_id: '456',
          metadata: updateData.metadata,
          is_archived: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await bitService.updateBit(bitId, updateData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE bits'),
        expect.arrayContaining([updateData.title, updateData.description, bitId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteBit', () => {
    it('should mark a bit as archived', async () => {
      const bitId = '123';
      const mockResult = {
        rows: [{
          id: bitId,
          title: 'Test Bit',
          description: 'Test Description',
          user_id: '456',
          metadata: {},
          is_archived: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await bitService.deleteBit(bitId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE bits SET is_archived'),
        expect.arrayContaining([bitId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getBitsByUser', () => {
    it('should retrieve all bits for a user', async () => {
      const userId = '123';
      const mockResult = {
        rows: [
          {
            id: '1',
            title: 'Bit 1',
            description: 'Description 1',
            user_id: userId,
            metadata: {},
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: '2',
            title: 'Bit 2',
            description: 'Description 2',
            user_id: userId,
            metadata: {},
            is_archived: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await bitService.getBitsByUser(userId);

      expect(result).toEqual(mockResult.rows);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM bits WHERE user_id'),
        expect.arrayContaining([userId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 
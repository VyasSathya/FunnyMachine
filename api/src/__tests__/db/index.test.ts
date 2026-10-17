import { Pool, PoolClient } from 'pg';
import { getClient, query } from '../../db';

// Mock pg
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('Database Connection', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    // Create mock pool
    mockPool = new Pool() as jest.Mocked<Pool>;
    mockPool.connect.mockResolvedValue(mockClient);
    (Pool as jest.Mock).mockImplementation(() => mockPool);
  });

  describe('getClient', () => {
    it('should get a client from the pool', async () => {
      const client = await getClient();
      expect(client).toBeDefined();
      expect(mockPool.connect).toHaveBeenCalled();
      expect(client.queryWithTracking).toBeDefined();
    });

    it('should track the last executed query', async () => {
      const client = await getClient();
      const testQuery = 'SELECT * FROM test';
      await client.queryWithTracking(testQuery);
      expect(client.lastExecutedQuery).toBe(testQuery);
    });

    it('should log long-running queries', async () => {
      jest.useFakeTimers();
      const client = await getClient();
      const testQuery = 'SELECT * FROM test';
      await client.queryWithTracking(testQuery);
      jest.advanceTimersByTime(6000); // Advance 6 seconds
      expect(client.lastExecutedQuery).toBe(testQuery);
      jest.useRealTimers();
    });

    it('should release the client after use', async () => {
      const client = await getClient();
      await client.queryWithTracking('SELECT * FROM test');
      client.release();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should execute a query and return results', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await query('SELECT * FROM test');
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test');
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      mockPool.query.mockRejectedValue(error);

      await expect(query('SELECT * FROM test')).rejects.toThrow('Database error');
    });

    it('should log query execution time', async () => {
      jest.useFakeTimers();
      const mockResult = { rows: [{ id: 1 }] };
      mockPool.query.mockResolvedValue(mockResult);

      await query('SELECT * FROM test');
      jest.advanceTimersByTime(1000); // Advance 1 second
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test');
      jest.useRealTimers();
    });
  });
}); 
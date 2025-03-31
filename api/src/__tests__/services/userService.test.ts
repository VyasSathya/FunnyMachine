import { PoolClient } from 'pg';
import { UserService } from '../../services/userService';
import { getClient } from '../../db';
import { User } from '../../types/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../db', () => ({
  getClient: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('UserService', () => {
  let userService: UserService;
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

    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        metadata: {},
        is_active: true,
      };

      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockResult = {
        rows: [{
          id: '123',
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          metadata: userData.metadata,
          is_active: userData.is_active,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([userData.email, hashedPassword, userData.name])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle errors when creating a user', async () => {
      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        metadata: {},
        is_active: true,
      };

      mockClient.queryWithTracking.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(userData)).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', async () => {
      const userId = '123';
      const mockResult = {
        rows: [{
          id: userId,
          email: 'test@example.com',
          password: 'hashedPassword123',
          name: 'Test User',
          metadata: {},
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await userService.getUser(userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        expect.arrayContaining([userId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      const userId = '123';
      mockClient.queryWithTracking.mockResolvedValue({ rows: [] });

      const result = await userService.getUser(userId);

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const userId = '123';
      const updateData: Partial<User> = {
        name: 'Updated Name',
        metadata: { updated: true },
      };

      const mockResult = {
        rows: [{
          id: userId,
          email: 'test@example.com',
          password: 'hashedPassword123',
          name: updateData.name,
          metadata: updateData.metadata,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([updateData.name, userId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should mark a user as inactive', async () => {
      const userId = '123';
      const mockResult = {
        rows: [{
          id: userId,
          email: 'test@example.com',
          password: 'hashedPassword123',
          name: 'Test User',
          metadata: {},
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);

      const result = await userService.deleteUser(userId);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockClient.queryWithTracking).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_active'),
        expect.arrayContaining([userId])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate a user and return a token', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      const token = 'jwtToken123';

      const mockResult = {
        rows: [{
          id: '123',
          email,
          password: hashedPassword,
          name: 'Test User',
          metadata: {},
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = await userService.login(email, password);

      expect(result).toEqual({
        user: mockResult.rows[0],
        token,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: '123', email }),
        expect.any(String),
        expect.any(Object)
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongPassword';

      const mockResult = {
        rows: [{
          id: '123',
          email,
          password: 'hashedPassword123',
          name: 'Test User',
          metadata: {},
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockClient.queryWithTracking.mockResolvedValue(mockResult);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.login(email, password);

      expect(result).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
}); 
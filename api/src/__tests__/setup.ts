import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.join(__dirname, '../../.env.test')
});

// Mock Redis client
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
    scanStream: jest.fn(),
    pipeline: jest.fn(() => ({
      del: jest.fn(),
      exec: jest.fn()
    })),
    on: jest.fn()
  }
}));

// Global test setup
beforeAll(() => {
  // Add any global setup here
});

// Global test teardown
afterAll(() => {
  // Add any global teardown here
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
}); 
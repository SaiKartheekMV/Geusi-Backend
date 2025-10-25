const { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } = require('./database');
const mongoose = require('mongoose');

beforeAll(async () => {
  await connectTestDatabase();
});

afterAll(async () => {
  await disconnectTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});

beforeEach(() => {
  jest.clearAllMocks();
});

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

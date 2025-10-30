const mongoose = require('mongoose');

describe('Jest Setup Test', () => {
  test('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  test('should have mongoose connection', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_ACCESS_SECRET).toBe('test-access-secret');
  });
});

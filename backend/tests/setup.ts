import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Global test setup
beforeAll(async () => {
  // Add any global setup here (e.g., database connection for integration tests)
  console.log('Starting tests...');
});

// Global test teardown
afterAll(async () => {
  // Add any global teardown here (e.g., closing database connections)
  console.log('Tests completed.');
});
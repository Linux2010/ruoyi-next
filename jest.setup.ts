// Jest setup: pure-logic tests must run without a real database.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "mysql://user:password@127.0.0.1:3306/ruoyi_next_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret-not-for-production";

jest.setTimeout(30000);

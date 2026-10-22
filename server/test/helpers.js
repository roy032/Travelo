import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import request from 'supertest';

// API tests run against a real MongoDB. Set MONGODB_TEST_URI (CI starts a
// mongo service container); without it the API suites are skipped.
export const TEST_DB_URI = process.env.MONGODB_TEST_URI;

process.env.JWT_SECRET ||= 'test-secret-for-api-tests-only';
process.env.AUTH_RATE_LIMIT_MAX ||= '1000';
process.env.FILE_STORAGE = 'local';
// Keep sign-up confirmation emails out of the test output
process.env.EMAIL_PROVIDER ||= 'memory';

export const connectTestDb = async () => {
  // A database per test file so files can run in parallel
  const url = new URL(TEST_DB_URI);
  url.pathname = `/travelo_test_${randomUUID().slice(0, 8)}`;
  await mongoose.connect(url.toString(), { serverSelectionTimeoutMS: 5000 });
  // Build unique indexes (e.g. User.email) before tests rely on them
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.syncIndexes())
  );
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

export const clearDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

let counter = 0;

/**
 * Sign up a new user and return a supertest agent that carries their cookie
 */
export const signUp = async (app, overrides = {}) => {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    name: `User ${counter}`,
    email: `user${counter}-${randomUUID().slice(0, 6)}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await agent.post('/api/auth/sign-up').send(body);
  if (res.status !== 201) {
    throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user, credentials: body };
};

/**
 * Sign up an account listed in ADMIN_EMAILS and sign it in, which is when the
 * server promotes it to admin
 */
export const signUpAdmin = async (app, overrides = {}) => {
  const email = `admin-${randomUUID().slice(0, 8)}@example.com`;
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = email;
  try {
    const admin = await signUp(app, { email, ...overrides });
    const res = await admin.agent
      .post('/api/auth/sign-in')
      .send({ email, password: admin.credentials.password });
    if (res.status !== 200) {
      throw new Error(`sign-in failed: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return { ...admin, user: res.body.user };
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
};

/**
 * Mark a user verified for both trip categories (normally done by an admin)
 */
export const verifyUser = async (userId) => {
  const { default: User } = await import('#models/user.model.js');
  await User.findByIdAndUpdate(userId, {
    verificationStatus: 'verified',
    'domesticVerification.status': 'verified',
    'internationalVerification.status': 'verified',
  });
};

export const futureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
};

// Smallest valid PNG (1x1 pixel)
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64'
);

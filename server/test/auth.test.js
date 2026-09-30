import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import mongoose from 'mongoose';
import request from 'supertest';

const testMongoUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/issuepilot_test';
const testDatabaseName = new URL(testMongoUri).pathname.slice(1).split('?')[0];
if (!/_test$/i.test(testDatabaseName)) {
  throw new Error('MONGODB_TEST_URI must point to a database whose name ends in _test.');
}

const clientOrigin = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = testMongoUri;
process.env.CLIENT_ORIGIN = clientOrigin;
process.env.AUTH_ACCESS_TOKEN_SECRET = 'test-access-secret-that-is-never-used-outside-tests';
process.env.AUTH_REFRESH_TOKEN_SECRET = 'test-refresh-secret-that-is-never-used-outside-tests';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';

let app;
let User;
let Session;

before(async () => {
  const [{ createApp }, { User: userModel }, { Session: sessionModel }, { env }, { connectDatabase }] = await Promise.all([
    import('../src/app.js'),
    import('../src/models/user.js'),
    import('../src/models/session.js'),
    import('../src/config/env.js'),
    import('../src/config/database.js'),
  ]);
  assert.equal(env.mongodbUri, testMongoUri, 'Tests must only connect to MONGODB_TEST_URI.');
  await connectDatabase(env.mongodbUri);
  User = userModel;
  Session = sessionModel;
  await Promise.all([User.init(), Session.init()]);
  app = createApp();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

const validRegistration = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'correct-horse-42',
};

function withOrigin(requestBuilder) {
  return requestBuilder.set('Origin', clientOrigin);
}

function cookiePair(response) {
  const header = response.headers['set-cookie']?.[0];
  assert.ok(header, 'Expected a refresh-token cookie.');
  return header.split(';', 1)[0];
}

async function registerUser(overrides = {}) {
  return withOrigin(request(app).post('/api/v1/auth/register'))
    .send({ ...validRegistration, ...overrides });
}

test('registration creates a user with a default role and sets an HttpOnly refresh cookie', async () => {
  const response = await registerUser({ systemRole: 'admin' });
  assert.equal(response.status, 201);
  assert.equal(response.body.user.name, 'Ada Lovelace');
  assert.equal(response.body.user.email, 'ada@example.com');
  assert.equal(response.body.user.systemRole, 'user');
  assert.equal('passwordHash' in response.body.user, false);
  assert.equal(typeof response.body.accessToken, 'string');
  const cookie = response.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\/api\/v1\/auth/i);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(await Session.countDocuments(), 1);
});

test('registration rejects invalid fields', async () => {
  const response = await registerUser({ name: 'A', email: 'invalid', password: 'short' });
  assert.equal(response.status, 400);
  assert.equal(await User.countDocuments(), 0);
});

test('duplicate normalized email returns 409', async () => {
  assert.equal((await registerUser()).status, 201);
  const response = await registerUser({ email: 'ADA@EXAMPLE.COM' });
  assert.equal(response.status, 409);
  assert.deepEqual(response.body, { error: { message: 'An account with this email already exists.' } });
});

test('login accepts normalized email and returns a safe user and access token', async () => {
  await registerUser();
  const response = await withOrigin(request(app).post('/api/v1/auth/login'))
    .send({ email: 'ADA@EXAMPLE.COM', password: validRegistration.password });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, validRegistration.email);
  assert.equal('passwordHash' in response.body.user, false);
  assert.equal(typeof response.body.accessToken, 'string');
  assert.match(response.headers['set-cookie'][0], /HttpOnly/i);
});

test('login uses a generic response for invalid credentials', async () => {
  await registerUser();
  const wrongPassword = await withOrigin(request(app).post('/api/v1/auth/login'))
    .send({ email: validRegistration.email, password: 'wrong-password-123' });
  const unknownEmail = await withOrigin(request(app).post('/api/v1/auth/login'))
    .send({ email: 'unknown@example.com', password: 'wrong-password-123' });
  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(wrongPassword.body, unknownEmail.body);
  assert.equal(wrongPassword.body.error.message, 'Invalid or expired credentials.');
});

test('protected /me rejects requests without an access token', async () => {
  const response = await request(app).get('/api/v1/auth/me');
  assert.equal(response.status, 401);
});

test('protected /me accepts an access token and never returns the password hash', async () => {
  const registration = await registerUser();
  const response = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${registration.body.accessToken}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, validRegistration.email);
  assert.equal('passwordHash' in response.body.user, false);
});

test('refresh rotates the persisted token and rejects reuse of the revoked token', async () => {
  const registration = await registerUser();
  const oldCookie = cookiePair(registration);
  const previousSession = await Session.findOne();

  const refreshed = await withOrigin(request(app).post('/api/v1/auth/refresh')).set('Cookie', oldCookie);
  assert.equal(refreshed.status, 200);
  assert.notEqual(cookiePair(refreshed), oldCookie);
  assert.notEqual(refreshed.body.accessToken, registration.body.accessToken);
  assert.ok((await Session.findById(previousSession._id)).revokedAt);
  assert.equal(await Session.countDocuments({ revokedAt: null }), 1);

  const reused = await withOrigin(request(app).post('/api/v1/auth/refresh')).set('Cookie', oldCookie);
  assert.equal(reused.status, 401);
  assert.equal(reused.body.error.message, 'Invalid or expired credentials.');
});

test('an access token cannot be used as a refresh token', async () => {
  const registration = await registerUser();
  const response = await withOrigin(request(app).post('/api/v1/auth/refresh'))
    .set('Cookie', `issuepilot_refresh=${registration.body.accessToken}`);
  assert.equal(response.status, 401);

  const refreshToken = cookiePair(registration).slice('issuepilot_refresh='.length);
  const protectedResponse = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${refreshToken}`);
  assert.equal(protectedResponse.status, 401);
});

test('logout revokes the refresh session and clears the cookie', async () => {
  const registration = await registerUser();
  const refreshCookie = cookiePair(registration);
  const response = await withOrigin(request(app).post('/api/v1/auth/logout')).set('Cookie', refreshCookie);
  assert.equal(response.status, 204);
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/i);
  assert.ok((await Session.findOne()).revokedAt);

  const refreshAfterLogout = await withOrigin(request(app).post('/api/v1/auth/refresh')).set('Cookie', refreshCookie);
  assert.equal(refreshAfterLogout.status, 401);
});

test('malformed JSON returns a safe 400 response without stack details', async () => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .set('Content-Type', 'application/json')
    .send('{not valid json');
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: { message: 'Invalid JSON request body.' } });
});

test('auth mutations reject a mismatched Origin', async () => {
  const response = await request(app)
    .post('/api/v1/auth/register')
    .set('Origin', 'https://attacker.example')
    .send(validRegistration);
  assert.equal(response.status, 403);
  assert.equal(await User.countDocuments(), 0);
});

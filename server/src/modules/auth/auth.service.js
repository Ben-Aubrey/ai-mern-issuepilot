import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Session } from '../../models/session.js';
import { User } from '../../models/user.js';

const JWT_OPTIONS = { algorithm: 'HS256', issuer: 'issuepilot', audience: 'issuepilot-app' };

function unauthorized() {
  const error = new Error('Invalid or expired credentials.');
  error.status = 401;
  return error;
}

function accessTokenFor(user) {
  return jwt.sign(
    { tokenType: 'access' },
    env.authAccessTokenSecret,
    { ...JWT_OPTIONS, subject: user._id.toString(), jwtid: randomUUID(), expiresIn: env.accessTokenTtl },
  );
}

async function createRefreshSession(user) {
  const refreshTokenId = randomUUID();
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await Session.create({ userId: user._id, refreshTokenId, expiresAt });
  const refreshToken = jwt.sign(
    { tokenType: 'refresh' },
    env.authRefreshTokenSecret,
    {
      ...JWT_OPTIONS,
      subject: user._id.toString(),
      jwtid: refreshTokenId,
      expiresIn: `${env.refreshTokenTtlDays}d`,
    },
  );
  return { refreshToken, accessToken: accessTokenFor(user), expiresAt };
}

export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({ name, email, passwordHash });
  return { user, ...(await createRefreshSession(user)) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!matches) throw unauthorized();
  return { user, ...(await createRefreshSession(user)) };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.authRefreshTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'issuepilot',
      audience: 'issuepilot-app',
    });
  } catch {
    throw unauthorized();
  }

  if (payload.tokenType !== 'refresh' || !payload.sub || !payload.jti) throw unauthorized();

  const now = new Date();
  const previousSession = await Session.findOneAndUpdate(
    { refreshTokenId: payload.jti, userId: payload.sub, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now } },
    { new: false },
  );
  if (!previousSession) throw unauthorized();

  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized();
  return { user, ...(await createRefreshSession(user)) };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  try {
    const payload = jwt.verify(refreshToken, env.authRefreshTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'issuepilot',
      audience: 'issuepilot-app',
    });
    if (payload.tokenType === 'refresh' && payload.jti) {
      await Session.updateOne(
        { refreshTokenId: payload.jti, userId: payload.sub, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }
  } catch {
    // Logout is idempotent; clearing an invalid or expired cookie is still safe.
  }
}

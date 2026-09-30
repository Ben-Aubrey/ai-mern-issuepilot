import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
if (!Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds < 10 || bcryptSaltRounds > 14) {
  throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 10 and 14.');
}

const refreshTokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
if (!Number.isInteger(refreshTokenTtlDays) || refreshTokenTtlDays < 1 || refreshTokenTtlDays > 30) {
  throw new Error('REFRESH_TOKEN_TTL_DAYS must be an integer between 1 and 30.');
}

const authAccessTokenSecret = required('AUTH_ACCESS_TOKEN_SECRET');
const authRefreshTokenSecret = required('AUTH_REFRESH_TOKEN_SECRET');
if (authAccessTokenSecret.length < 32 || authRefreshTokenSecret.length < 32) {
  throw new Error('JWT secrets must be at least 32 characters long.');
}
if (authAccessTokenSecret === authRefreshTokenSecret) {
  throw new Error('Access-token and refresh-token secrets must be different.');
}

const accessTokenTtl = process.env.ACCESS_TOKEN_TTL ?? '15m';
if (!/^1[0-5]m$/.test(accessTokenTtl)) {
  throw new Error('ACCESS_TOKEN_TTL must be between 10m and 15m.');
}

const clientOrigin = required('CLIENT_ORIGIN');
let parsedClientOrigin;
try {
  parsedClientOrigin = new URL(clientOrigin);
} catch {
  throw new Error('CLIENT_ORIGIN must be a valid origin URL.');
}
if (!['http:', 'https:'].includes(parsedClientOrigin.protocol) || parsedClientOrigin.origin !== clientOrigin) {
  throw new Error('CLIENT_ORIGIN must contain only an http or https origin without a path.');
}

export const env = Object.freeze({
  port,
  mongodbUri: required('MONGODB_URI'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientOrigin,
  authAccessTokenSecret,
  authRefreshTokenSecret,
  accessTokenTtl,
  refreshTokenTtlDays,
  bcryptSaltRounds,
});

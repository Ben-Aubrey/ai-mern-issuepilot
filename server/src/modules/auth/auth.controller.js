import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

export const REFRESH_COOKIE_NAME = 'issuepilot_refresh';
const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
};

function setRefreshCookie(response, refreshToken, expiresAt) {
  response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions,
    expires: expiresAt,
  });
}

function clearRefreshCookie(response) {
  response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
}

function sendSession(response, result, status = 200) {
  setRefreshCookie(response, result.refreshToken, result.expiresAt);
  return response.status(status).json({ user: result.user, accessToken: result.accessToken });
}

export async function register(request, response) {
  return sendSession(response, await authService.register(request.validatedBody), 201);
}

export async function login(request, response) {
  return sendSession(response, await authService.login(request.validatedBody));
}

export async function refresh(request, response) {
  try {
    return sendSession(response, await authService.refresh(request.cookies[REFRESH_COOKIE_NAME]));
  } catch (error) {
    if (error.status === 401) clearRefreshCookie(response);
    throw error;
  }
}

export async function logout(request, response) {
  await authService.logout(request.cookies[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(response);
  return response.status(204).end();
}

export function currentUser(request, response) {
  return response.json({ user: request.user });
}

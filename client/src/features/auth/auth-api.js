import { apiRequest } from '../../lib/api-client.js';

export const register = (details) =>
  apiRequest('/auth/register', { method: 'POST', body: details });

export const login = (credentials) =>
  apiRequest('/auth/login', { method: 'POST', body: credentials });

export const refresh = () => apiRequest('/auth/refresh', { method: 'POST' });

export const logout = () => apiRequest('/auth/logout', { method: 'POST' });

export const getCurrentUser = (accessToken) =>
  apiRequest('/auth/me', { accessToken });

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.js';

export async function authenticate(request, response, next) {
  const authorization = request.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return response.status(401).json({ error: { message: 'Authentication required.' } });

  let payload;
  try {
    payload = jwt.verify(match[1], env.authAccessTokenSecret, {
      algorithms: ['HS256'],
      issuer: 'issuepilot',
      audience: 'issuepilot-app',
    });
    if (payload.tokenType !== 'access' || !payload.sub) {
      return response.status(401).json({ error: { message: 'Authentication required.' } });
    }

  } catch {
    return response.status(401).json({ error: { message: 'Authentication required.' } });
  }

  if (payload.tokenType !== 'access' || !payload.sub) {
    return response.status(401).json({ error: { message: 'Authentication required.' } });
  }

  const user = await User.findById(payload.sub);
  if (!user) return response.status(401).json({ error: { message: 'Authentication required.' } });
  request.user = user;
  return next();
}

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as authController from './auth.controller.js';
import { validateLogin, validateRegistration } from './auth.validation.js';

const router = Router();
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many registration attempts. Try again later.' } },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { message: 'Too many login attempts. Try again later.' } },
});

function verifyOrigin(request, response, next) {
  const origin = request.get('origin');
  if (origin && origin !== env.clientOrigin) {
    return response.status(403).json({ error: { message: 'Request origin is not allowed.' } });
  }
  return next();
}

router.post('/register', verifyOrigin, registerLimiter, validateRegistration, authController.register);
router.post('/login', verifyOrigin, loginLimiter, validateLogin, authController.login);
router.post('/refresh', verifyOrigin, authController.refresh);
router.post('/logout', verifyOrigin, authController.logout);
router.get('/me', authenticate, authController.currentUser);

export default router;

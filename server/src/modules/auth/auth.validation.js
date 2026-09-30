const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function bodyObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Request body must be an object.');
  return body;
}

export function validateRegistration(request, response, next) {
  try {
    const body = bodyObject(request.body);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2 || name.length > 80) invalid('Name must be between 2 and 80 characters.');
    if (email.length > 254 || !emailPattern.test(email)) invalid('Enter a valid email address.');
    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (passwordBytes < 8 || passwordBytes > 72) invalid('Password must be between 8 and 72 bytes.');

    request.validatedBody = { name, email, password };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function validateLogin(request, response, next) {
  try {
    const body = bodyObject(request.body);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (email.length > 254 || !emailPattern.test(email) || !password) {
      invalid('Email and password are required.');
    }
    request.validatedBody = { email, password };
    return next();
  } catch (error) {
    return next(error);
  }
}

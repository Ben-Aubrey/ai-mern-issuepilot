export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  let status = Number.isInteger(error.status) ? error.status : 500;
  let message = status >= 500 ? 'Internal server error.' : error.message;

  if (error.code === 11000) {
    status = 409;
    message = 'An account with this email already exists.';
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    status = 400;
    message = 'Invalid request data.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON request body.';
  }

  if (status >= 500) console.error(error);

  return response.status(status).json({ error: { message } });
}

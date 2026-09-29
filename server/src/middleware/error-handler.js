export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 ? 'Internal server error.' : error.message;
  if (status >= 500) console.error(error);

  return response.status(status).json({ error: { message } });
}

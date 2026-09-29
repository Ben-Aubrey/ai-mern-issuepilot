export function notFoundHandler(request, response) {
  return response.status(404).json({
    error: { message: `Route not found: ${request.method} ${request.originalUrl}` },
  });
}

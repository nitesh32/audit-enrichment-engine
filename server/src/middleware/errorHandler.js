import { AppError } from '../errors/errors.js';

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

export function notFoundHandler(_request, response) {
  response.status(HTTP_NOT_FOUND).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

/** Maps typed errors to HTTP responses; anything else is logged and returned as 500. */
export function errorHandler(logger) {
  return (error, _request, response, _next) => {
    if (error instanceof AppError) {
      const { code, message, details } = error;
      return response.status(error.statusCode).json({ error: { code, message, details } });
    }
    if (error.type === 'entity.parse.failed') {
      return response
        .status(HTTP_BAD_REQUEST)
        .json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' } });
    }
    logger.error({ err: error }, 'request.failed');
    return response
      .status(HTTP_INTERNAL_ERROR)
      .json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  };
}

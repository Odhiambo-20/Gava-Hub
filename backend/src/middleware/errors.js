import { AppError } from '../utils/errors.js';

export function errorHandler(error, _req, res, _next) {
  if (!(error instanceof AppError) && error.status !== 401 && error.status !== 403) {
    console.error(error);
  }

  const status = error.status || 500;
  const body = {
    status,
    message: status >= 500 && !(error instanceof AppError) ? 'Internal server error' : error.message,
  };
  if (error.violations && typeof error.violations === 'object') {
    body.violations = error.violations;
  }
  res.status(status).json(body);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ status: 404, message: 'Not found' });
}

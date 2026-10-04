import { registerUser, authenticateUser, issueTokenResponse } from './service.js';

export function registerAuth(app, prefix) {
  app.post(`${prefix}/auth/register`, async (req, res, next) => {
    try {
      const user = await registerUser(req.body || {});
      res.status(201).json(issueTokenResponse(user));
    } catch (error) {
      next(error);
    }
  });

  app.post(`${prefix}/auth/login`, async (req, res, next) => {
    try {
      const user = await authenticateUser(req.body || {});
      res.json(issueTokenResponse(user));
    } catch (error) {
      next(error);
    }
  });
}

import { authenticateUser, issueToken, publicUser, registerUser } from './service.js';

export function registerAuth(app, prefix) {
  app.post(`${prefix}/register`, async (req, res, next) => {
    try { const user = await registerUser(req.body || {}); res.status(201).json({ ...publicUser(user), accessToken: issueToken(user) }); }
    catch (error) { error.status ||= 400; next(error); }
  });
  app.post(`${prefix}/login`, async (req, res, next) => {
    try { const user = await authenticateUser(req.body || {}); res.json({ ...publicUser(user), accessToken: issueToken(user) }); }
    catch (error) { error.status ||= 401; next(error); }
  });
}

export { authenticateUser, issueToken, publicUser, registerUser };

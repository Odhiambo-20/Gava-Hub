import jwt from 'jsonwebtoken';
import { securityConfig } from '../config/security.js';
export function requireAuth(request, response, next) {
  const header = request.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return response.status(401).json({ message: 'Authentication required' });
  try { request.user = jwt.verify(header.slice(7), securityConfig.jwtSecret || 'local-development-secret-change-me', { issuer: securityConfig.jwtIssuer }); next(); }
  catch { response.status(401).json({ message: 'Invalid or expired token' }); }
}

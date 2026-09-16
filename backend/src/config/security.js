import { config } from './index.js';
export const securityConfig = Object.freeze({ ...config.security });
export function validateSecurityConfig() { if (!securityConfig.jwtSecret) throw new Error('JWT_SECRET is required'); if (config.nodeEnv === 'production' && securityConfig.jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters in production'); }
export const tokenOptions = () => ({ issuer: securityConfig.jwtIssuer, expiresIn: securityConfig.jwtTtl });


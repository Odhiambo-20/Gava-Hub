import { config } from './index.js';

const DEV_SECRET = 'local-development-secret-change-me-before-production';

export const securityConfig = Object.freeze({
  ...config.security,
  /** Effective secret used for sign/verify */
  effectiveSecret: config.security.jwtSecret || DEV_SECRET,
});

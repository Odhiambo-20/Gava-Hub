import { config } from './index.js';
export const mailConfig = Object.freeze({ ...config.mail });
export const isMailConfigured = () => Boolean(mailConfig.host && mailConfig.from);
export function validateMailConfig() { if (!mailConfig.from.includes('@') || !mailConfig.support.includes('@')) throw new Error('Email configuration is invalid'); if (config.nodeEnv === 'production' && !mailConfig.host) throw new Error('SMTP_HOST is required in production'); }


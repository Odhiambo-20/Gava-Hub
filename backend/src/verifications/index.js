import { registerCrud } from '../modules/crud.js'; export const registerVerifications = (app, prefix) => registerCrud(app, 'verifications', `${prefix}/verifications`);

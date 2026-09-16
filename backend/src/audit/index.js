import { registerCrud } from '../modules/crud.js'; export const registerAudit = (app, prefix) => registerCrud(app, 'audit', `${prefix}/audit`);

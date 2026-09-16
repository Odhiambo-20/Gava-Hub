import { registerCrud } from '../modules/crud.js'; export const registerCredentials = (app, prefix) => registerCrud(app, 'credentials', `${prefix}/credentials`);

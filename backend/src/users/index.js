import { registerCrud } from '../modules/crud.js'; export const registerUsers = (app, prefix) => registerCrud(app, 'users', `${prefix}/users`);

import { registerCrud } from '../modules/crud.js'; export const registerNotifications = (app, prefix) => registerCrud(app, 'notifications', `${prefix}/notifications`);

import { registerCrud } from '../modules/crud.js'; export const registerBilling = (app, prefix) => registerCrud(app, 'invoices', `${prefix}/invoices`);

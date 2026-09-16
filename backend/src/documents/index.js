import { registerCrud } from '../modules/crud.js'; export const registerDocuments = (app, prefix) => registerCrud(app, 'documents', `${prefix}/documents`);

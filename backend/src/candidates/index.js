import { registerCrud } from '../modules/crud.js'; export const registerCandidates = (app, prefix) => registerCrud(app, 'candidates', `${prefix}/candidates`);

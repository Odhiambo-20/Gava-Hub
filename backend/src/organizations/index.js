import { registerCrud } from '../modules/crud.js'; export const registerOrganizations = (app, prefix) => registerCrud(app, 'organizations', `${prefix}/organizations`);

import { createInvoice, getInvoice, listInvoices, updateInvoice, voidInvoice } from './service.js';

export function registerBilling(app, prefix) {
  app.get(`${prefix}/invoices`, async (req, res, next) => { try { res.json(await listInvoices(req.query.userId)); } catch (error) { next(error); } });
  app.get(`${prefix}/invoices/:id`, async (req, res, next) => { try { const invoice = await getInvoice(req.params.id); invoice ? res.json(invoice) : res.status(404).json({ message: 'Invoice not found' }); } catch (error) { next(error); } });
  app.post(`${prefix}/invoices`, async (req, res, next) => { try { res.status(201).json(await createInvoice(req.body || {})); } catch (error) { error.status ||= 400; next(error); } });
  app.put(`${prefix}/invoices/:id`, async (req, res, next) => { try { const invoice = await updateInvoice(req.params.id, req.body || {}); invoice ? res.json(invoice) : res.status(404).json({ message: 'Invoice not found' }); } catch (error) { error.status ||= 400; next(error); } });
  app.delete(`${prefix}/invoices/:id`, async (req, res, next) => { try { const changed = await voidInvoice(req.params.id); changed ? res.status(204).end() : res.status(404).end(); } catch (error) { error.status ||= 409; next(error); } });
}

export { createInvoice, getInvoice, listInvoices, updateInvoice, voidInvoice };

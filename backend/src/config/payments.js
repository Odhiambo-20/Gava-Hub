import { config } from './index.js';
export const paymentConfig = Object.freeze({ ...config.payments });
export const isCoopPaybill = () => paymentConfig.method === 'COOP_PAYBILL';
export const isDaraja = () => paymentConfig.method === 'DARAJA';
export const paymentInstructions = () => ({ provider: 'Co-operative Bank of Kenya', paybillNumber: paymentConfig.coopPaybillNumber, accountNumber: paymentConfig.coopAccountNumber, method: paymentConfig.method });
export function validatePaymentConfig() { if (!/^\\d{6}$/.test(paymentConfig.coopPaybillNumber)) throw new Error('COOP_PAYBILL_NUMBER must contain six digits'); if (!/^\\d+$/.test(paymentConfig.coopAccountNumber)) throw new Error('COOP_ACCOUNT_NUMBER must contain digits only'); if (!['COOP_PAYBILL','DARAJA'].includes(paymentConfig.method)) throw new Error('Invalid PAYMENT_METHOD'); }


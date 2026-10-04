import { config } from './index.js';
import { AppError } from '../utils/errors.js';

export const paymentConfig = Object.freeze({ ...config.payments });

export function validatePaymentConfig() {
  if (!/^\d{6}$/.test(paymentConfig.coopPaybillNumber)) {
    throw new AppError('COOP_PAYBILL_NUMBER must contain six digits', 500);
  }
  if (!/^\d+$/.test(paymentConfig.coopAccountNumber)) {
    throw new AppError('COOP_ACCOUNT_NUMBER must contain digits only', 500);
  }
  if (!['COOP_PAYBILL', 'DARAJA'].includes(paymentConfig.method)) {
    throw new AppError('Invalid PAYMENT_METHOD', 500);
  }
}

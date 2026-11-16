import type { PaymentDecision, PaymentMethod, RequestStatus } from '../types';

export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function computePlatformCharge(originalFee: number, percent = 20): number {
  return Math.round((originalFee * percent) / 100);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Pending';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  if (method === 'upi') return 'UPI / QR Transfer';
  if (method === 'bank_transfer') return 'Bank Transfer (NEFT / IMPS)';
  return 'Card / Online Payment';
}

export function getPaymentStatusMeta(paymentStatus: PaymentDecision): {
  label: string;
  badgeClass: string;
} {
  switch (paymentStatus) {
    case 'approved':
      return {
        label: 'Payment Approved',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'rejected':
      return {
        label: 'Payment Rejected',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    default:
      return {
        label: 'Payment Pending',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
  }
}

export function getStatusMeta(status: RequestStatus): {
  label: string;
  description: string;
  badgeClass: string;
} {
  switch (status) {
    case 'payment_submitted':
      return {
        label: 'Pending Admin Check',
        description: 'Details and fee payment submitted. Waiting for Admin Platform review.',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'verified':
      return {
        label: 'Approved & Verified',
        description: 'Admin approved payment, customer details, and required documents.',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      };
    case 'processing_physically':
      return {
        label: 'Processing Physically',
        description: 'Currently being handled at the physical service counter.',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    case 'slip_issued':
      return {
        label: 'Official Slip Issued',
        description: 'Physical processing complete and official service slip generated.',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'rejected':
      return {
        label: 'Application / Payment Rejected',
        description: 'Rejected during Admin Platform verification. Check review remarks.',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      };
  }
}

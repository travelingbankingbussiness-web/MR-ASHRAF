import React from 'react';
import { CheckCircle2, Printer, ShieldCheck } from 'lucide-react';
import type { BusinessSettings, ServiceRequest } from '../types';
import type { AppLanguage } from '../i18n/translations';
import { formatCurrency, formatDateTime, formatPaymentMethodLabel } from '../utils/whatsapp';

interface OfficialSlipCardProps {
  request: ServiceRequest;
  settings: Omit<BusinessSettings, 'ownerPasscode'>;
  showPrintButton?: boolean;
  lang?: AppLanguage;
}

const SLIP_HEADINGS: Record<
  AppLanguage,
  {
    officialLabel: string;
    slipNumber: string;
    applicantDetails: string;
    processingRecord: string;
    formDetails: string;
    feeBreakdown: string;
    totalPaid: string;
    remarks: string;
    printBtn: string;
  }
> = {
  en: {
    officialLabel: 'OFFICIAL PHYSICAL PROCESSING SLIP',
    slipNumber: 'Official Slip Number',
    applicantDetails: 'Applicant / Customer Details',
    processingRecord: 'Physical Processing Record',
    formDetails: 'Verified Application Form Details',
    feeBreakdown: 'Verified Fee Breakdown',
    totalPaid: 'Total Paid',
    remarks: 'Owner Processing Remarks',
    printBtn: 'Print / Save Slip PDF',
  },
  hi: {
    officialLabel: 'आधिकारिक भौतिक प्रक्रिया स्लिप (OFFICIAL SLIP)',
    slipNumber: 'आधिकारिक स्लिप नंबर',
    applicantDetails: 'आवेदक / ग्राहक विवरण',
    processingRecord: 'भौतिक प्रक्रिया रिकॉर्ड',
    formDetails: 'सत्यापित आवेदन फॉर्म विवरण',
    feeBreakdown: 'सत्यापित शुल्क विवरण',
    totalPaid: 'कुल भुगतान',
    remarks: 'संचालक की अंतिम टिप्पणी',
    printBtn: 'स्लिप प्रिंट / PDF सेव करें',
  },
  bn: {
    officialLabel: 'অফিশিয়াল ফিজিক্যাল প্রসেসিং স্লিপ (OFFICIAL SLIP)',
    slipNumber: 'অফিশিয়াল স্লিপ নম্বর',
    applicantDetails: 'আবেদনকারী / গ্রাহকের বিবরণ',
    processingRecord: 'ফিজিক্যাল প্রসেসিং রেকর্ড',
    formDetails: 'যাচাইকৃত আবেদন ফর্মের তথ্য',
    feeBreakdown: 'যাচাইকৃত ফি বিবরণ',
    totalPaid: 'সর্বমোট পরিশোধিত',
    remarks: 'পরিচালকের চূড়ান্ত মন্তব্য',
    printBtn: 'স্লিপ প্রিন্ট / PDF সেভ করুন',
  },
};

export const OfficialSlipCard: React.FC<OfficialSlipCardProps> = ({
  request,
  settings,
  showPrintButton = true,
  lang = 'en',
}) => {
  if (!request.slip) return null;

  const h = SLIP_HEADINGS[lang];
  const money = (amount: number) => formatCurrency(amount, request.currencySymbol);
  const codeSeed = `${request.slip.slipNumber}-${request.slip.verificationCode}`;
  const bars = Array.from({ length: 38 }, (_, idx) => {
    const charCode = codeSeed.charCodeAt(idx % codeSeed.length);
    const width = ((charCode + idx) % 3) + 1;
    const gap = ((charCode * (idx + 3)) % 2) + 1;
    return { width, gap };
  });

  const customEntries = Object.entries(request.customDetails || {});

  return (
    <div className="print-only-slip bg-white border border-neutral-300 rounded-xl overflow-hidden text-[#0A0A0C]">
      {/* Top Official Header Band (Black + Gold) */}
      <div className="px-6 py-5 border-b-2 border-[#D49B28] bg-[#0A0A0C] text-white flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <img
            src="/src/assets/images/mr_ashraf_logo_1794751667761.jpg"
            alt={settings.businessName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-[#D49B28] shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F0B949] mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{h.officialLabel}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {settings.businessName}
            </h3>
            <p className="text-xs text-neutral-300 mt-0.5">
              {settings.officeAddress} · {settings.supportEmail}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs text-neutral-400">{h.slipNumber}</div>
          <div className="font-mono text-lg font-bold text-[#F0B949] tabular-nums">
            {request.slip.slipNumber}
          </div>
          <div className="text-xs text-neutral-300 mt-1">
            Issued {formatDateTime(request.slip.issuedAt)}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider">
              {h.applicantDetails}
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                <dt className="text-neutral-500">Customer Name</dt>
                <dd className="font-medium text-[#0A0A0C] text-right">{request.customerName}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                <dt className="text-neutral-500">Mobile Contact</dt>
                <dd className="font-mono text-xs text-[#0A0A0C] text-right tabular-nums">
                  +{request.customerWhatsapp}
                </dd>
              </div>
              {request.customerEmail && (
                <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                  <dt className="text-neutral-500">Email</dt>
                  <dd className="text-[#0A0A0C] text-right">{request.customerEmail}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-neutral-500 shrink-0">Address</dt>
                <dd className="text-[#0A0A0C] text-right">
                  {request.customerAddress}, {request.customerCity} {request.customerPostalCode}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider">
              {h.processingRecord}
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                <dt className="text-neutral-500">Request ID</dt>
                <dd className="font-mono text-xs font-semibold text-[#0A0A0C] tabular-nums">
                  {request.requestNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                <dt className="text-neutral-500">Category / Service</dt>
                <dd className="font-medium text-[#0A0A0C] text-right">
                  {request.serviceCategory} · {request.serviceName}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1 border-b border-neutral-100">
                <dt className="text-neutral-500">Processed By</dt>
                <dd className="text-[#0A0A0C] text-right">
                  {request.physicalProcessing.handlerName || settings.ownerName} ·{' '}
                  {request.physicalProcessing.deskCounter || 'Main Counter'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-neutral-500">Application Subject</dt>
                <dd className="text-[#0A0A0C] text-right">
                  {request.subjectTitle} (Qty {request.quantity})
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Service Form Box Details */}
        {customEntries.length > 0 && (
          <div className="border border-neutral-200 rounded-lg p-4 bg-[#F6F6F7]">
            <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider mb-2.5">
              {h.formDetails}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {customEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between gap-3 py-1 border-b border-neutral-200/70">
                  <span className="text-neutral-500">{key}</span>
                  <span className="font-medium text-[#0A0A0C] text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Payment Fee Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-[#F6F6F7] px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-[#0A0A0C]">
              {h.feeBreakdown} (Original Fee + {request.platformChargePercent}% Platform Charge)
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payment Verified ({formatPaymentMethodLabel(request.paymentMethod)})
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">
                Original Service Fee ({request.quantity} ×{' '}
                {money(request.originalFee / Math.max(1, request.quantity))})
              </span>
              <span className="font-mono tabular-nums text-[#0A0A0C]">
                {money(request.originalFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">
                Platform Service Charge ({request.platformChargePercent}% of Original Fee)
              </span>
              <span className="font-mono tabular-nums text-[#0A0A0C]">
                {money(request.platformCharge)}
              </span>
            </div>
            {request.expressFee > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Express Priority Processing</span>
                <span className="font-mono tabular-nums text-[#0A0A0C]">
                  {money(request.expressFee)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
              <div>
                <span className="font-bold text-[#0A0A0C]">{h.totalPaid}</span>
                <span className="ml-2 font-mono text-xs text-neutral-500">
                  Ref: {request.paymentReference}
                </span>
              </div>
              <span className="font-mono text-base font-bold tabular-nums text-[#0A0A0C]">
                {money(request.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks & Verification Stamp Footer */}
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="text-xs font-semibold text-neutral-500">{h.remarks}</div>
            <p className="text-sm text-neutral-700 leading-relaxed">{request.slip.finalRemarks}</p>
            <div className="text-xs font-mono text-neutral-500 pt-1">
              Verification ID: {request.slip.verificationCode} · Authorized by {request.slip.issuedBy}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="border-2 border-[#0A0A0C] bg-[#FEF7E6] text-[#0A0A0C] px-3 py-1.5 rounded-md text-center">
              <div className="text-[10px] font-bold tracking-widest uppercase text-[#8A5A00]">
                Verified &amp; Processed
              </div>
              <div className="font-mono text-xs font-bold tabular-nums">
                {request.slip.slipNumber}
              </div>
            </div>

            <svg
              width="92"
              height="38"
              viewBox="0 0 110 38"
              aria-label="Slip verification barcode"
              className="hidden sm:block"
            >
              {bars.reduce<{ x: number; els: React.ReactNode[] }>(
                (acc, bar, idx) => {
                  const el = (
                    <rect
                      key={idx}
                      x={acc.x}
                      y={2}
                      width={bar.width}
                      height={34}
                      fill="#0A0A0C"
                    />
                  );
                  return { x: acc.x + bar.width + bar.gap, els: [...acc.els, el] };
                },
                { x: 0, els: [] }
              ).els}
            </svg>
          </div>
        </div>

        {showPrintButton && (
          <div className="no-print pt-3 border-t border-neutral-100 flex justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#F0B949] bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {h.printBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

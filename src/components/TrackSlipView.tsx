import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  PackageCheck,
  Search,
  XCircle,
} from 'lucide-react';
import type { BusinessSettings, DocumentStatus, ServiceRequest } from '../types';
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethodLabel,
  getPaymentStatusMeta,
  getStatusMeta,
} from '../utils/whatsapp';
import {
  type AppLanguage,
  UI_STRINGS,
  getLocalizedDocName,
} from '../i18n/translations';
import { OfficialSlipCard } from './OfficialSlipCard';
import { DirectChatBox } from './DirectChatBox';

interface TrackSlipViewProps {
  settings: Omit<BusinessSettings, 'ownerPasscode'>;
  initialQuery?: string;
  recentRequestNumbers: string[];
  lang: AppLanguage;
  isActiveWindow?: boolean;
  customerToken?: string | null;
}

function getDocBadge(
  status: DocumentStatus,
  labels: { verified: string; missing: string; pending: string }
): { label: string; cls: string } {
  if (status === 'verified') {
    return {
      label: labels.verified,
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  if (status === 'missing') {
    return {
      label: labels.missing,
      cls: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }
  return {
    label: labels.pending,
    cls: 'bg-[#FEF7E6] text-[#8A5A00] border-[#E8CE96]',
  };
}

export const TrackSlipView: React.FC<TrackSlipViewProps> = ({
  settings,
  initialQuery = '',
  recentRequestNumbers,
  lang,
  isActiveWindow = false,
  customerToken = null,
}) => {
  const t = UI_STRINGS[lang];
  const [query, setQuery] = useState(initialQuery || 'SRV-2026-1001');
  const [results, setResults] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const performLookup = async (refToFind: string) => {
    const trimmed = refToFind.trim();
    if (!trimmed) {
      setError('Enter a Request ID (e.g. SRV-2026-1001), Slip Number, or Mobile number.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearchedOnce(true);
    try {
      const res = await fetch(`/api/track?ref=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lookup failed.');
      }
      setResults(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch status.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startRef = initialQuery || 'SRV-2026-1001';
    setQuery(startRef);
    performLookup(startRef);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(query);
  };

  const quickRefs = Array.from(
    new Set([...recentRequestNumbers, 'SRV-2026-1001', 'SRV-2026-1002'])
  ).slice(0, 5);

  return (
    <section
      id="window-slip-tracking"
      className="scroll-mt-32 max-w-7xl mx-auto px-4 sm:px-6 pb-14"
    >
      <div
        className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
          isActiveWindow
            ? 'border-[#0A0A0C] ring-2 ring-[#E5A93B]/45 shadow-md'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <div className="no-print px-6 py-4 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0B949]">
              <span>{t.scrolling.window4Badge}</span>
              {isActiveWindow && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-white">{t.scrolling.activeWindowTag}</span>
                </>
              )}
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
              {t.scrolling.window4Title}
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-300">{query}</span>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <div className="no-print space-y-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0C]">
                {t.track.heading}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">{t.track.subheading}</p>
            </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.track.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? t.track.searchingBtn : t.track.searchBtn}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>{t.track.recentLabel}</span>
          {quickRefs.map((refId) => (
            <button
              key={refId}
              type="button"
              onClick={() => {
                setQuery(refId);
                performLookup(refId);
              }}
              className={`px-2.5 py-1 font-mono rounded-md border transition-colors cursor-pointer ${
                query.toUpperCase() === refId.toUpperCase()
                  ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#0A0A0C]'
              }`}
            >
              {refId}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="no-print p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {error}
        </div>
      )}

      {!loading && searchedOnce && results.length === 0 && !error && (
        <div className="no-print p-8 bg-white border border-neutral-200 rounded-xl text-center space-y-2">
          <div className="text-base font-semibold text-[#0A0A0C]">{t.track.noMatchTitle}</div>
          <p className="text-sm text-neutral-600">{t.track.noMatchDesc}</p>
        </div>
      )}

      <div className="space-y-8">
        {results.map((req) => {
          const statusMeta = getStatusMeta(req.status);
          const payMeta = getPaymentStatusMeta(req.paymentStatus || 'pending');
          const isRejected = req.status === 'rejected' || req.paymentStatus === 'rejected';
          const stageIndex = isRejected
            ? 0
            : req.status === 'payment_submitted'
            ? 1
            : req.status === 'verified'
            ? 2
            : req.status === 'processing_physically'
            ? 3
            : 4;
          const reqDocs = Array.from(
            new Set([
              ...(req.requiredDocuments || []),
              ...Object.keys(req.uploadedDocuments || {}),
            ])
          );

          return (
            <div key={req.id} className="space-y-6">
              <div className="no-print bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="font-mono font-semibold text-[#8A5A00]">
                        {req.requestNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{req.serviceCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDateTime(req.createdAt)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#0A0A0C] mt-1">
                      {req.serviceName}
                    </h2>
                    <div className="text-sm text-neutral-600 mt-0.5">
                      {req.customerName} ·{' '}
                      <span className="font-mono font-bold tabular-nums text-[#0A0A0C]">
                        {formatCurrency(req.totalAmount, req.currencySymbol)}
                      </span>{' '}
                      ({t.catalog.originalLabel} {formatCurrency(req.originalFee, req.currencySymbol)} +{' '}
                      {req.platformChargePercent}% {t.catalog.chargeLabel}{' '}
                      {formatCurrency(req.platformCharge, req.currencySymbol)} ·{' '}
                      {formatPaymentMethodLabel(req.paymentMethod)} · Ref:{' '}
                      <span className="font-mono">{req.paymentReference}</span>)
                      {req.paymentScreenshot && (
                        <>
                          {' · '}
                          <a
                            href={req.paymentScreenshot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#8A5A00] hover:text-[#0A0A0C] underline underline-offset-2"
                          >
                            Payment Screenshot
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md whitespace-nowrap shrink-0 ${payMeta.badgeClass}`}
                    >
                      {req.paymentStatus === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : req.paymentStatus === 'rejected' ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {payMeta.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-md whitespace-nowrap shrink-0 ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                {isRejected ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div className="text-sm text-rose-900 space-y-1">
                      <div className="font-semibold">
                        Application or Payment Marked Rejected
                      </div>
                      <p className="text-xs text-rose-800">
                        {req.paymentReviewNote ||
                          req.verification?.verificationNotes ||
                          'Please contact Mr Ashraf Banking Traveling Communication counter with your UTR receipt to resolve.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 4-Stage Pipeline Tracker */
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {[
                      {
                        idx: 1,
                        title: 'Details & Payment Sent',
                        sub: `UTR ${req.paymentReference}`,
                        icon: CheckCircle2,
                      },
                      {
                        idx: 2,
                        title: 'Admin Payment Approved',
                        sub: req.paymentReviewedAt
                          ? `Approved ${formatDateTime(req.paymentReviewedAt)}`
                          : 'Pending Admin check',
                        icon: FileCheck2,
                      },
                      {
                        idx: 3,
                        title: 'Processing Physically',
                        sub: req.physicalProcessing.startedAt
                          ? `${req.physicalProcessing.deskCounter || 'Counter'} · ${
                              req.physicalProcessing.handlerName
                            }`
                          : 'Queued for counter',
                        icon: PackageCheck,
                      },
                      {
                        idx: 4,
                        title: 'Official Slip Issued',
                        sub: req.slip
                          ? `Slip ${req.slip.slipNumber}`
                          : 'Issued upon completion',
                        icon: CheckCircle2,
                      },
                    ].map((stage) => {
                      const completed = stageIndex >= stage.idx;
                      const Icon = stage.icon;
                      return (
                        <div
                          key={stage.idx}
                          className={`p-3.5 rounded-lg border ${
                            completed
                              ? 'bg-[#FEF7E6] border-[#D49B28] text-[#0A0A0C]'
                              : 'bg-[#F6F6F7] border-neutral-200 text-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                completed ? 'text-[#8A5A00]' : 'text-neutral-400'
                              }`}
                            />
                            <span>{stage.title}</span>
                          </div>
                          <div className="text-xs mt-1.5 text-neutral-600 truncate">{stage.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {req.paymentReviewNote && !isRejected && (
                  <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg text-sm text-neutral-700">
                    <span className="font-semibold text-[#0A0A0C]">Payment Check Remark: </span>
                    {req.paymentReviewNote}
                  </div>
                )}

                {/* Required Documents Status List */}
                {reqDocs.length > 0 && (
                  <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-[#8A5A00]" />
                        {t.track.docsStatusTitle}
                      </div>
                      <span className="text-xs font-mono text-neutral-600 tabular-nums">
                        {reqDocs.filter((d) => req.documentsChecklist?.[d] === 'verified').length}/
                        {reqDocs.length} {t.track.verifiedLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {reqDocs.map((docName) => {
                        const docStatus: DocumentStatus =
                          req.documentsChecklist?.[docName] || 'pending';
                        const badge = getDocBadge(docStatus, {
                          verified: t.track.verifiedLabel,
                          missing: t.track.missingLabel,
                          pending: t.track.pendingLabel,
                        });
                        const uploaded = req.uploadedDocuments?.[docName];
                        return (
                          <div
                            key={docName}
                            className="flex items-center justify-between gap-2 p-2.5 bg-white border border-neutral-200 rounded-lg text-xs"
                          >
                            <div className="min-w-0">
                              <div className="text-[#0A0A0C] font-medium">
                                {getLocalizedDocName(docName, lang)}
                                {docName === 'Other Document 1 (Optional)' &&
                                req.customDetails?.['Other Document 1 Name'] ? (
                                  <span className="ml-1 text-[11px] font-normal text-neutral-500">
                                    ({req.customDetails['Other Document 1 Name']})
                                  </span>
                                ) : null}
                                {docName === 'Other Document 2 (Optional)' &&
                                req.customDetails?.['Other Document 2 Name'] ? (
                                  <span className="ml-1 text-[11px] font-normal text-neutral-500">
                                    ({req.customDetails['Other Document 2 Name']})
                                  </span>
                                ) : null}
                              </div>
                              {uploaded && (
                                <a
                                  href={uploaded.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-[#8A5A00] hover:underline truncate block max-w-[200px]"
                                >
                                  {uploaded.originalName} ({Math.max(1, Math.ceil(uploaded.sizeBytes / 1024))} KB)
                                </a>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold border rounded whitespace-nowrap shrink-0 ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {req.documentsReviewNote && (
                      <div className="text-xs text-neutral-700 pt-1">
                        <span className="font-semibold text-[#0A0A0C]">Document Note: </span>
                        {req.documentsReviewNote}
                      </div>
                    )}
                  </div>
                )}

                {req.physicalProcessing.processingNotes && (
                  <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg text-sm text-neutral-700">
                    <span className="font-semibold text-[#0A0A0C]">Physical Desk Note: </span>
                    {req.physicalProcessing.processingNotes}
                  </div>
                )}
              </div>

              <DirectChatBox
                role="customer"
                request={req}
                authToken={customerToken}
                lang={lang}
                onRequestUpdated={(updated) => {
                  setResults((prev) =>
                    prev.map((item) => (item.id === updated.id ? updated : item))
                  );
                }}
                onPrintSlipClick={() => window.print()}
              />

              {req.slip && <OfficialSlipCard request={req} settings={settings} lang={lang} />}
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </section>
  );
};

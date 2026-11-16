import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Landmark,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import type {
  BusinessSettings,
  CustomerAccount,
  PaymentMethod,
  ProcessingSpeed,
  ServicePackage,
  ServiceRequest,
  UploadedDocumentFile,
} from '../types';
import {
  EXTRA_OTHER_DOCUMENTS,
  EXTRA_OTHER_DOCUMENT_NAMES,
  getDocumentMeta,
  PAYMENT_SCREENSHOT_DOC_NAME,
  PAYMENT_SCREENSHOT_META,
} from '../constants/documents';
import {
  CATEGORY_TRANSLATIONS,
  getLocalizedDocName,
  getLocalizedService,
  UI_STRINGS,
  type AppLanguage,
} from '../i18n/translations';
import {
  computePlatformCharge,
  formatCurrency,
  formatPaymentMethodLabel,
} from '../utils/whatsapp';
import { QrPaymentMatrix } from './QrPaymentMatrix';

export type PortalWindowNumber = 1 | 2 | 3 | 4;

interface ServiceWizardProps {
  services: ServicePackage[];
  settings: Omit<BusinessSettings, 'ownerPasscode'>;
  lang: AppLanguage;
  selectedServiceId: string;
  onSelectServiceId: (serviceId: string) => void;
  activeWindow: PortalWindowNumber;
  onJumpToWindow: (win: PortalWindowNumber, customElementId?: string) => void;
  onRequestCreated: (req: ServiceRequest) => void;
  onNavigateTrack: (requestNumber: string) => void;
  onProgressUpdate?: (progress: {
    personalDone: boolean;
    serviceFormDone: boolean;
    paymentSubmitted: boolean;
  }) => void;
  customerAccount?: CustomerAccount | null;
  customerToken?: string | null;
  onOpenAuth?: (tab?: 'signin' | 'signup' | 'profile') => void;
}

export const ServiceWizard: React.FC<ServiceWizardProps> = ({
  services,
  settings,
  lang,
  selectedServiceId,
  onSelectServiceId,
  activeWindow,
  onJumpToWindow,
  onRequestCreated,
  onNavigateTrack,
  onProgressUpdate,
  customerAccount = null,
  customerToken = null,
  onOpenAuth,
}) => {
  const t = UI_STRINGS[lang];
  const [processingSpeed, setProcessingSpeed] = useState<ProcessingSpeed>('standard');
  const [activeSubPanel, setActiveSubPanel] = useState<'2a' | '2b'>('2a');

  // Window 2A: Customer Personal Details
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPostalCode, setCustomerPostalCode] = useState('');

  // Window 2B: Service-Specific Input Boxes + Documents (According to Service Type)
  const [customDetails, setCustomDetails] = useState<Record<string, string>>({});
  const [subjectTitle, setSubjectTitle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [referenceCode, setReferenceCode] = useState('');
  const [detailedInstructions, setDetailedInstructions] = useState('');
  const [customerConfirmedDocuments, setCustomerConfirmedDocuments] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocumentFile>>(
    {}
  );
  const [uploadingDocName, setUploadingDocName] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Window 3: Payment Gateway
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<UploadedDocumentFile | null>(null);
  const [uploadingPaymentShot, setUploadingPaymentShot] = useState(false);
  const [paymentShotError, setPaymentShotError] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Submission State & Section Errors
  const [submitting, setSubmitting] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrImgFailed, setQrImgFailed] = useState(false);

  const prevServiceIdRef = useRef<string>(selectedServiceId);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );

  // When selected Service Type changes, adapt Service-Specific Boxes & Required Docs cleanly
  useEffect(() => {
    if (prevServiceIdRef.current !== selectedServiceId) {
      prevServiceIdRef.current = selectedServiceId;
      setCustomDetails({});
      setCustomerConfirmedDocuments([]);
      setUploadedDocuments({});
      setUploadErrors({});
      setPersonalError(null);
      setPaymentError(null);
      const nextSrv = services.find((s) => s.id === selectedServiceId);
      setSubjectTitle(nextSrv ? nextSrv.name : '');
    } else if (!subjectTitle && selectedService) {
      setSubjectTitle(selectedService.name);
    }
  }, [selectedServiceId, services, selectedService, subjectTitle]);

  useEffect(() => {
    if (!customerAccount) return;
    setCustomerName((prev) => prev || customerAccount.fullName || '');
    setCustomerWhatsapp((prev) => prev || customerAccount.phone || '');
    setCustomerEmail((prev) => prev || customerAccount.email || '');
    setCustomerAddress((prev) => prev || customerAccount.address || '');
    setCustomerCity((prev) => prev || customerAccount.city || '');
    setCustomerPostalCode((prev) => prev || customerAccount.postalCode || '');
  }, [customerAccount]);

  const personalDone = useMemo(() => {
    const digits = customerWhatsapp.replace(/[^\d]/g, '');
    return (
      customerName.trim().length >= 2 &&
      digits.length >= 10 &&
      customerAddress.trim().length >= 4 &&
      customerCity.trim().length >= 2
    );
  }, [customerName, customerWhatsapp, customerAddress, customerCity]);

  const serviceFormDone = useMemo(() => {
    if (!selectedService) return false;
    if (subjectTitle.trim().length < 3) return false;
    for (const field of selectedService.customFields || []) {
      if (field.required && !(customDetails[field.key] || '').trim()) {
        return false;
      }
    }
    return true;
  }, [selectedService, subjectTitle, customDetails]);

  useEffect(() => {
    onProgressUpdate?.({
      personalDone,
      serviceFormDone,
      paymentSubmitted: Boolean(createdRequest),
    });
  }, [personalDone, serviceFormDone, createdRequest, onProgressUpdate]);

  const handleUploadDocFile = async (docName: string, file: File | null) => {
    if (!file) return;
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[docName];
      return next;
    });

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      setUploadErrors((prev) => ({
        ...prev,
        [docName]: 'Invalid format. Only JPG, JPEG, PNG, or PDF files are allowed.',
      }));
      return;
    }

    const meta = getDocumentMeta(docName);
    if (file.size > meta.maxSizeBytes) {
      setUploadErrors((prev) => ({
        ...prev,
        [docName]: `File size (${Math.ceil(file.size / 1024)} KB) exceeds ${meta.maxSizeLabel} limit for ${docName}.`,
      }));
      return;
    }

    setUploadingDocName(docName);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Document upload failed.');
      }

      setUploadedDocuments((prev) => ({ ...prev, [docName]: data.file }));
      setCustomerConfirmedDocuments((prev) => (prev.includes(docName) ? prev : [...prev, docName]));
    } catch (err) {
      setUploadErrors((prev) => ({
        ...prev,
        [docName]: err instanceof Error ? err.message : 'Upload failed.',
      }));
    } finally {
      setUploadingDocName(null);
    }
  };

  const handleRemoveUploadedDoc = (docName: string) => {
    setUploadedDocuments((prev) => {
      const next = { ...prev };
      delete next[docName];
      return next;
    });
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[docName];
      return next;
    });
  };

  const handleUploadPaymentScreenshot = async (file: File | null) => {
    if (!file) return;
    setPaymentShotError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      setPaymentShotError('Invalid format. Only JPG, JPEG, PNG, or PDF files are allowed.');
      return;
    }

    if (file.size > PAYMENT_SCREENSHOT_META.maxSizeBytes) {
      setPaymentShotError(
        `File size (${Math.ceil(file.size / 1024)} KB) exceeds ${PAYMENT_SCREENSHOT_META.maxSizeLabel} limit.`
      );
      return;
    }

    setUploadingPaymentShot(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName: PAYMENT_SCREENSHOT_DOC_NAME,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment screenshot upload failed.');
      }
      setPaymentScreenshot(data.file);
    } catch (err) {
      setPaymentShotError(err instanceof Error ? err.message : 'Payment screenshot upload failed.');
    } finally {
      setUploadingPaymentShot(false);
    }
  };

  const platformPercent = settings.platformChargePercent ?? 20;

  const pricing = useMemo(() => {
    if (!selectedService) {
      return { originalFee: 0, platformCharge: 0, expressFee: 0, total: 0 };
    }
    const safeQty = Math.max(1, Math.min(100, quantity));
    const originalFee = selectedService.originalFee * safeQty;
    const platformCharge = computePlatformCharge(originalFee, platformPercent);
    const expressFee = processingSpeed === 'express' ? selectedService.expressAddonFee : 0;
    return {
      originalFee,
      platformCharge,
      expressFee,
      total: originalFee + platformCharge + expressFee,
    };
  }, [selectedService, quantity, processingSpeed, platformPercent]);

  const money = (amount: number) => formatCurrency(amount, settings.currencySymbol);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard errors in restricted environments
    }
  };

  const validatePersonalPanel = (): string | null => {
    const digits = customerWhatsapp.replace(/[^\d]/g, '');
    if (customerName.trim().length < 2) {
      return 'Please enter your full name.';
    }
    if (digits.length < 10) {
      return 'Please enter a valid mobile number with country code (e.g. 919876543210).';
    }
    if (customerAddress.trim().length < 4 || customerCity.trim().length < 2) {
      return 'Please enter your street/village address and district/city.';
    }
    return null;
  };

  const validateServicePanel = (): string | null => {
    if (!selectedService) {
      return 'Please select a Service Type in Window 01.';
    }
    if (selectedService.customFields) {
      for (const field of selectedService.customFields) {
        if (field.required && !(customDetails[field.key] || '').trim()) {
          return `Please fill the required box: "${field.label}".`;
        }
      }
    }
    if (subjectTitle.trim().length < 3) {
      return 'Please enter an application subject or title.';
    }
    return null;
  };

  const handleNextToServiceBoxes = () => {
    const err = validatePersonalPanel();
    if (err) {
      setPersonalError(err);
      onJumpToWindow(2, 'subwindow-personal');
      return;
    }
    setPersonalError(null);
    if (!payerName.trim()) {
      setPayerName(customerName.trim());
    }
    if (!subjectTitle.trim() && selectedService) {
      setSubjectTitle(selectedService.name);
    }
    setActiveSubPanel('2b');
    onJumpToWindow(2, 'subwindow-service-boxes');
  };

  const handleNextToPaymentGateway = () => {
    const pErr = validatePersonalPanel();
    if (pErr) {
      setPersonalError(pErr);
      setActiveSubPanel('2a');
      onJumpToWindow(2, 'subwindow-personal');
      return;
    }
    const sErr = validateServicePanel();
    if (sErr) {
      setPersonalError(sErr);
      setActiveSubPanel('2b');
      onJumpToWindow(2, 'subwindow-service-boxes');
      return;
    }
    setPersonalError(null);
    setPaymentError(null);
    if (!payerName.trim()) {
      setPayerName(customerName.trim());
    }
    onJumpToWindow(3, 'window-payment-gateway');
  };

  const handleCompletePaymentAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const pErr = validatePersonalPanel();
    if (pErr) {
      setPersonalError(pErr);
      setPaymentError(pErr);
      setActiveSubPanel('2a');
      onJumpToWindow(2, 'subwindow-personal');
      return;
    }

    const sErr = validateServicePanel();
    if (sErr) {
      setPersonalError(sErr);
      setPaymentError(sErr);
      setActiveSubPanel('2b');
      onJumpToWindow(2, 'subwindow-service-boxes');
      return;
    }

    if (!selectedService) {
      setPaymentError('Service selection missing.');
      return;
    }
    if (paymentReference.trim().length < 4) {
      setPaymentError('Please enter your payment Transaction ID / UTR reference number.');
      return;
    }
    if (!paymentConfirmed) {
      setPaymentError('Please tick the confirmation box that your fee payment is complete.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          processingSpeed,
          customerName,
          customerWhatsapp,
          customerEmail,
          customerAddress,
          customerCity,
          customerPostalCode,
          subjectTitle: subjectTitle.trim() || selectedService.name,
          quantity,
          preferredDate,
          referenceCode,
          detailedInstructions,
          customDetails,
          customerConfirmedDocuments,
          uploadedDocuments,
          paymentMethod,
          paymentReference,
          payerName: payerName || customerName,
          paymentScreenshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save your request.');
      }

      setCreatedRequest(data.request);
      onRequestCreated(data.request);
      onNavigateTrack(data.request.requestNumber);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Unexpected submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnotherRequest = () => {
    setCreatedRequest(null);
    setCustomDetails({});
    setCustomerConfirmedDocuments([]);
    setUploadedDocuments({});
    setUploadErrors({});
    setSubjectTitle(selectedService?.name || '');
    setReferenceCode('');
    setDetailedInstructions('');
    setPaymentReference('');
    setPaymentScreenshot(null);
    setUploadingPaymentShot(false);
    setPaymentShotError(null);
    setPaymentConfirmed(false);
    setPersonalError(null);
    setPaymentError(null);
    setActiveSubPanel('2a');
    onJumpToWindow(1, 'window-service-type');
  };

  const upiUri = selectedService
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
        settings.upiPayeeName
      )}&am=${pricing.total}&cu=INR`
    : '';

  const selectedLoc = selectedService ? getLocalizedService(selectedService, lang) : null;
  const serviceReqDocs = selectedService?.requiredDocuments || [];
  const requiredUploadedCount = serviceReqDocs.filter((d) =>
    Boolean(uploadedDocuments[d])
  ).length;
  const extraUploadedCount = EXTRA_OTHER_DOCUMENT_NAMES.filter((d) =>
    Boolean(uploadedDocuments[d])
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 8 COLUMNS: TRANSITION WINDOWS 02 & 03 */}
        <div className="lg:col-span-8 space-y-10">
          {/* ================================================================ */}
          {/* WINDOW 02: PERSONAL DETAILS & SERVICE-SPECIFIC FORM + DOCUMENTS  */}
          {/* ================================================================ */}
          <section
            id="window-personal-details"
            className={`scroll-mt-32 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
              activeWindow === 2
                ? 'border-[#0A0A0C] ring-2 ring-[#E5A93B]/45 shadow-md'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {/* Window 02 Black & Gold Transition Header */}
            <div className="px-6 py-4 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0B949]">
                  <span>{t.scrolling.window2Badge}</span>
                  {activeWindow === 2 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-white">{t.scrolling.activeWindowTag}</span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  {t.scrolling.window2Title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onJumpToWindow(1, 'window-service-type')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t.scrolling.backToServiceTypeBtn}
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Active Service Type Context & Quick Service + Speed Bar */}
              {selectedService && (
                <div className="p-4 sm:p-5 bg-[#FEF7E6] border border-[#E8CE96] rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#8A5A00]">
                        {t.scrolling.selectedServiceBanner}{' '}
                        {CATEGORY_TRANSLATIONS[selectedService.categoryKey][lang].title}
                      </div>
                      <div className="text-base font-bold text-[#0A0A0C] mt-0.5">
                        {selectedLoc?.name || selectedService.name}
                      </div>
                      <p className="text-xs text-neutral-700 mt-0.5">{t.scrolling.window2Sub}</p>
                    </div>

                    <div className="sm:w-64 shrink-0">
                      <label htmlFor="quick-srv-switch" className="sr-only">
                        Service Type
                      </label>
                      <select
                        id="quick-srv-switch"
                        value={selectedService.id}
                        onChange={(e) => onSelectServiceId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold text-[#0A0A0C] bg-white border border-[#D49B28] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      >
                        {services.map((srv) => (
                          <option key={srv.id} value={srv.id}>
                            {getLocalizedService(srv, lang).name} (
                            {money(
                              srv.originalFee +
                                computePlatformCharge(srv.originalFee, platformPercent)
                            )}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Processing Speed Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8CE96]/80">
                    <button
                      type="button"
                      onClick={() => setProcessingSpeed('standard')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        processingSpeed === 'standard'
                          ? 'border-[#0A0A0C] bg-white shadow-xs'
                          : 'border-[#E8CE96] bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs sm:text-sm font-semibold text-[#0A0A0C]">
                          {t.wizard.standardDesk}
                        </span>
                        <span className="font-mono text-xs text-neutral-600">
                          {t.wizard.included}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        {t.wizard.readyIn} {selectedService.turnaroundStandard}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProcessingSpeed('express')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        processingSpeed === 'express'
                          ? 'border-[#0A0A0C] bg-white shadow-xs'
                          : 'border-[#E8CE96] bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs sm:text-sm font-semibold text-[#0A0A0C]">
                          {t.wizard.expressPriority}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#8A5A00] tabular-nums">
                          +{money(selectedService.expressAddonFee)}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        {t.wizard.readyIn} {selectedService.turnaroundExpress}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-Window Switcher: 2A Personal Details -> 2B Service Type Form & Docs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F6F7] border border-neutral-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubPanel('2a');
                    onJumpToWindow(2, 'subwindow-personal');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeSubPanel === '2a'
                      ? 'bg-[#0A0A0C] text-white'
                      : 'text-neutral-600 hover:text-[#0A0A0C]'
                  }`}
                >
                  {personalDone && <Check className="w-3.5 h-3.5 text-[#E5A93B] shrink-0" />}
                  <span className="truncate">{t.scrolling.window2SubPersonal}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubPanel('2b');
                    onJumpToWindow(2, 'subwindow-service-boxes');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeSubPanel === '2b'
                      ? 'bg-[#0A0A0C] text-white'
                      : 'text-neutral-600 hover:text-[#0A0A0C]'
                  }`}
                >
                  {serviceFormDone && <Check className="w-3.5 h-3.5 text-[#E5A93B] shrink-0" />}
                  <span className="truncate">{t.scrolling.window2SubService}</span>
                </button>
              </div>

              {personalError && (
                <div
                  role="alert"
                  className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800"
                >
                  {personalError}
                </div>
              )}

              {/* SUB-WINDOW 2A: PERSONAL DETAILS */}
              <div
                id="subwindow-personal"
                className={`scroll-mt-36 space-y-5 rounded-xl p-5 border transition-colors ${
                  activeSubPanel === '2a'
                    ? 'border-[#0A0A0C] bg-white'
                    : 'border-neutral-200 bg-[#F6F6F7]/40'
                }`}
                onFocus={() => setActiveSubPanel('2a')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-[#0A0A0C]">{t.wizard.step2Title}</h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {t.wizard.selectedServiceLabel}{' '}
                      <strong className="text-[#0A0A0C]">
                        {selectedLoc?.name || selectedService?.name}
                      </strong>
                    </p>
                  </div>
                  {personalDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready
                    </span>
                  )}
                </div>

                {/* Signed-in Profile Sync Bar / Sign In Prompt */}
                {customerAccount ? (
                  <div className="px-3.5 py-2.5 bg-[#FEF7E6] border border-[#E8CE96] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {customerAccount.photoUrl && (
                        <img
                          src={customerAccount.photoUrl}
                          alt={customerAccount.fullName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-[#0A0A0C] shrink-0"
                        />
                      )}
                      <span className="text-[#5C3B00]">
                        <strong className="text-[#0A0A0C]">{customerAccount.fullName}</strong> ·{' '}
                        {t.auth.applyWithProfileNote}
                      </span>
                    </div>
                    {onOpenAuth && (
                      <button
                        type="button"
                        onClick={() => onOpenAuth('profile')}
                        className="font-semibold text-[#8A5A00] hover:text-[#0A0A0C] underline underline-offset-2 whitespace-nowrap cursor-pointer"
                      >
                        {t.auth.myProfileBtn}
                      </button>
                    )}
                  </div>
                ) : (
                  onOpenAuth && (
                    <div className="px-3.5 py-2.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-600">{t.auth.termsHeading}</span>
                      <button
                        type="button"
                        onClick={() => onOpenAuth('signup')}
                        className="px-3 py-1.5 font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {t.auth.loginRegisterBtn}
                      </button>
                    </div>
                  )
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="cust-name"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.fullNameLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="cust-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cust-wa"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.mobileLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="cust-wa"
                      type="tel"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="e.g. 919876543210"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cust-email"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.emailLabel}
                    </label>
                    <input
                      id="cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cust-addr"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.addressLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="cust-addr"
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="House / Ward / Village / Post Office"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cust-city"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.cityLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="cust-city"
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="e.g. Malda / North 24 Parganas"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cust-pin"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.pinLabel}
                    </label>
                    <input
                      id="cust-pin"
                      type="text"
                      value={customerPostalCode}
                      onChange={(e) => setCustomerPostalCode(e.target.value)}
                      placeholder="e.g. 732101"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextToServiceBoxes}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.scrolling.continueToServiceBoxesBtn}
                    <ArrowRight className="w-4 h-4 text-[#E5A93B]" />
                  </button>
                </div>
              </div>

              {/* SUB-WINDOW 2B: SERVICE TYPE SPECIFIC BOXES & SUPPORTING DOCUMENTS */}
              {selectedService && (
                <div
                  id="subwindow-service-boxes"
                  className={`scroll-mt-36 space-y-6 rounded-xl p-5 border transition-colors ${
                    activeSubPanel === '2b'
                      ? 'border-[#0A0A0C] bg-white'
                      : 'border-neutral-200 bg-[#F6F6F7]/40'
                  }`}
                  onFocus={() => setActiveSubPanel('2b')}
                >
                  <div className="pb-3 border-b border-neutral-100">
                    <div className="text-xs font-medium text-[#8A5A00]">
                      {CATEGORY_TRANSLATIONS[selectedService.categoryKey][lang].title}
                    </div>
                    <h3 className="text-base font-bold text-[#0A0A0C] mt-0.5">
                      {t.wizard.step3TitlePrefix} {selectedLoc?.name || selectedService.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1">{t.wizard.step3Sub}</p>
                  </div>

                  {/* Dedicated Custom Input Boxes for this Service Type */}
                  <div className="p-4 sm:p-5 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-4">
                    <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                      {t.wizard.serviceBoxesHeading}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedService.customFields.map((field) => {
                        const val = customDetails[field.key] || '';
                        return (
                          <div key={field.key} className="sm:col-span-1">
                            <label
                              htmlFor={`cf-${field.key}`}
                              className="block text-sm font-medium text-[#0A0A0C] mb-1.5"
                            >
                              {field.label}{' '}
                              {field.required && <span className="text-rose-600">*</span>}
                            </label>

                            {field.type === 'select' && field.options ? (
                              <select
                                id={`cf-${field.key}`}
                                value={val}
                                onChange={(e) =>
                                  setCustomDetails((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                              >
                                <option value="">{field.placeholder || 'Select an option'}</option>
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`cf-${field.key}`}
                                type={field.type || 'text'}
                                value={val}
                                onChange={(e) =>
                                  setCustomDetails((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Standard Application Metadata Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="spec-title"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        {t.wizard.subjectLabel} <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="spec-title"
                        type="text"
                        value={subjectTitle}
                        onChange={(e) => setSubjectTitle(e.target.value)}
                        placeholder={`e.g. ${selectedService.name}`}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="spec-qty"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        {t.wizard.quantityLabel}
                      </label>
                      <input
                        id="spec-qty"
                        type="number"
                        min={1}
                        max={100}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="spec-date"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        {t.wizard.preferredDateLabel}
                      </label>
                      <input
                        id="spec-date"
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="spec-ref"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        {t.wizard.oldRefLabel}
                      </label>
                      <input
                        id="spec-ref"
                        type="text"
                        value={referenceCode}
                        onChange={(e) => setReferenceCode(e.target.value)}
                        placeholder="Optional existing acknowledgement or file number"
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="spec-notes"
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                      >
                        {t.wizard.notesLabel}
                      </label>
                      <textarea
                        id="spec-notes"
                        rows={3}
                        value={detailedInstructions}
                        onChange={(e) => setDetailedInstructions(e.target.value)}
                        placeholder="Mention any extra spellings, courier preferences, or physical document notes..."
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                  </div>

                  {/* Documents Upload — Service Required + 2 Extra Boxes for Other Document */}
                  <div className="p-4 sm:p-5 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-5">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                          <FileText className="w-4 h-4 text-[#8A5A00]" />
                          {t.wizard.docsHeading}
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#0A0A0C] tabular-nums whitespace-nowrap">
                          {requiredUploadedCount}/{serviceReqDocs.length} {t.catalog.requiredLabel}
                          {extraUploadedCount > 0 ? ` · +${extraUploadedCount}` : ''}
                        </span>
                      </div>

                      <div className="px-3.5 py-2.5 bg-[#FEF7E6] border border-[#E8CE96] rounded-lg text-xs text-[#5C3B00] leading-relaxed">
                        <strong className="font-bold text-[#0A0A0C]">
                          {t.wizard.docsNoteStrong}
                        </strong>{' '}
                        {t.wizard.docsNoteRest}
                      </div>
                    </div>

                    {serviceReqDocs.length > 0 && (
                      <div className="space-y-3">
                        {serviceReqDocs.map((docName, idx) => {
                          const meta = getDocumentMeta(docName);
                          const uploaded = uploadedDocuments[docName];
                          const isUploading = uploadingDocName === docName;
                          const docErr = uploadErrors[docName];
                          const checkedCounter = customerConfirmedDocuments.includes(docName);

                          return (
                            <div
                              key={docName}
                              className={`p-3.5 rounded-xl border bg-white space-y-2.5 transition-colors ${
                                docErr
                                  ? 'border-rose-300'
                                  : uploaded
                                  ? 'border-[#0A0A0C]'
                                  : 'border-neutral-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-[#8A5A00]">
                                      {String(idx + 1).padStart(2, '0')}.
                                    </span>
                                    <span className="text-sm font-semibold text-[#0A0A0C]">
                                      {getLocalizedDocName(docName, lang)}
                                    </span>
                                    <span className="text-[11px] font-mono text-neutral-500">
                                      {meta.acceptedFormatsLabel} · {meta.maxSizeLabel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-500 mt-0.5">{meta.examples}</p>
                                </div>

                                {!uploaded ? (
                                  <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0">
                                    <Upload className="w-3.5 h-3.5 text-[#E5A93B]" />
                                    <span>
                                      {isUploading ? t.wizard.uploadingBtn : t.wizard.uploadFileBtn}
                                    </span>
                                    <input
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                      disabled={isUploading}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        handleUploadDocFile(docName, file);
                                        e.target.value = '';
                                      }}
                                      className="sr-only"
                                    />
                                  </label>
                                ) : (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <a
                                      href={uploaded.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0A0A0C] bg-neutral-100 hover:bg-neutral-200 rounded-md"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {t.wizard.viewBtn}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUploadedDoc(docName)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                      {t.wizard.removeBtn}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {uploaded && (
                                <div className="flex items-center gap-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                                  {uploaded.mimeType.startsWith('image/') ? (
                                    <img
                                      src={uploaded.url}
                                      alt={docName}
                                      className="w-10 h-10 rounded object-cover border border-emerald-200 bg-white shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-white border border-emerald-200 flex items-center justify-center font-mono text-[10px] font-bold text-rose-700 shrink-0">
                                      PDF
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-emerald-950 truncate">
                                      {uploaded.originalName}
                                    </div>
                                    <div className="font-mono text-[11px] text-emerald-800">
                                      Uploaded · {Math.max(1, Math.ceil(uploaded.sizeBytes / 1024))} KB
                                    </div>
                                  </div>
                                </div>
                              )}

                              {!uploaded && (
                                <label className="inline-flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={checkedCounter}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCustomerConfirmedDocuments((prev) =>
                                          prev.includes(docName) ? prev : [...prev, docName]
                                        );
                                      } else {
                                        setCustomerConfirmedDocuments((prev) =>
                                          prev.filter((d) => d !== docName)
                                        );
                                      }
                                    }}
                                    className="w-3.5 h-3.5 accent-[#0A0A0C] cursor-pointer"
                                  />
                                  <span>{t.wizard.readyAtCounterLabel}</span>
                                </label>
                              )}

                              {docErr && (
                                <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
                                  {docErr}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2 Extra Boxes for Other Document */}
                    <div className="pt-4 border-t border-neutral-200 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                          {t.wizard.docsExtraTitle}
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5">{t.wizard.docsExtraSub}</p>
                      </div>

                      <div className="space-y-3">
                        {EXTRA_OTHER_DOCUMENTS.map((extraMeta, extraIdx) => {
                          const docName = extraMeta.name;
                          const labelFieldKey = `Other Document ${extraIdx + 1} Name`;
                          const uploaded = uploadedDocuments[docName];
                          const isUploading = uploadingDocName === docName;
                          const docErr = uploadErrors[docName];

                          return (
                            <div
                              key={docName}
                              className={`p-3.5 rounded-xl border bg-white space-y-2.5 transition-colors ${
                                docErr
                                  ? 'border-rose-300'
                                  : uploaded
                                  ? 'border-[#0A0A0C]'
                                  : 'border-dashed border-neutral-300'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-[#8A5A00]">
                                      Extra {String(extraIdx + 1).padStart(2, '0')}.
                                    </span>
                                    <span className="text-sm font-semibold text-[#0A0A0C]">
                                      {getLocalizedDocName(docName, lang)}
                                    </span>
                                    <span className="text-[11px] font-mono text-neutral-500">
                                      {extraMeta.acceptedFormatsLabel} · {extraMeta.maxSizeLabel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    {extraMeta.examples}
                                  </p>
                                </div>

                                {!uploaded ? (
                                  <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>
                                      {isUploading ? t.wizard.uploadingBtn : t.wizard.uploadExtraBtn}
                                    </span>
                                    <input
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                      disabled={isUploading}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        handleUploadDocFile(docName, file);
                                        e.target.value = '';
                                      }}
                                      className="sr-only"
                                    />
                                  </label>
                                ) : (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <a
                                      href={uploaded.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0A0A0C] bg-neutral-100 hover:bg-neutral-200 rounded-md"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      {t.wizard.viewBtn}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUploadedDoc(docName)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                      {t.wizard.removeBtn}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={customDetails[labelFieldKey] || ''}
                                  onChange={(e) =>
                                    setCustomDetails((prev) => ({
                                      ...prev,
                                      [labelFieldKey]: e.target.value,
                                    }))
                                  }
                                  placeholder={t.wizard.extraDocNamePlaceholder}
                                  className="w-full px-3 py-1.5 text-xs bg-[#F6F6F7] border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                                />
                              </div>

                              {uploaded && (
                                <div className="flex items-center gap-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                                  {uploaded.mimeType.startsWith('image/') ? (
                                    <img
                                      src={uploaded.url}
                                      alt={docName}
                                      className="w-10 h-10 rounded object-cover border border-emerald-200 bg-white shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-white border border-emerald-200 flex items-center justify-center font-mono text-[10px] font-bold text-rose-700 shrink-0">
                                      PDF
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-emerald-950 truncate">
                                      {uploaded.originalName}
                                    </div>
                                    <div className="font-mono text-[11px] text-emerald-800">
                                      Uploaded · {Math.max(1, Math.ceil(uploaded.sizeBytes / 1024))} KB
                                    </div>
                                  </div>
                                </div>
                              )}

                              {docErr && (
                                <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
                                  {docErr}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Next-to-Next Transition Bar to Window 03: Payment Gateway */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => onJumpToWindow(1, 'window-service-type')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t.scrolling.backToServiceTypeBtn}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextToPaymentGateway}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {t.scrolling.continueToPaymentBtn}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* WINDOW 03: PAYMENT GATEWAY (ORIGINAL FEE + 20% PLATFORM CHARGE)  */}
          {/* ================================================================ */}
          <section
            id="window-payment-gateway"
            className={`scroll-mt-32 bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
              activeWindow === 3
                ? 'border-[#0A0A0C] ring-2 ring-[#E5A93B]/45 shadow-md'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            {/* Window 03 Black & Gold Header */}
            <div className="px-6 py-4 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F0B949]">
                  <span>{t.scrolling.window3Badge}</span>
                  {activeWindow === 3 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-white">{t.scrolling.activeWindowTag}</span>
                    </>
                  )}
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  {t.scrolling.window3Title}
                </h2>
              </div>

              <div className="font-mono text-base sm:text-lg font-bold text-[#E5A93B] tabular-nums">
                {money(pricing.total)}
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {createdRequest && (
                <div className="window-transition p-5 bg-[#0A0A0C] text-white border border-neutral-800 rounded-xl space-y-4">
                  <div className="flex items-start gap-3.5">
                    <CheckCircle2 className="w-6 h-6 text-[#E5A93B] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-base font-bold text-white">
                        {t.scrolling.justSubmittedTitle}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                        Request ID:{' '}
                        <strong className="font-mono text-[#F0B949]">
                          {createdRequest.requestNumber}
                        </strong>{' '}
                        · {t.scrolling.justSubmittedDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigateTrack(createdRequest.requestNumber)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ReceiptText className="w-4 h-4" />
                      {t.wizard.trackDownloadBtn}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(createdRequest.requestNumber, 'req-id')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === 'req-id'
                        ? t.wizard.copiedIdBtn
                        : `${t.wizard.copyIdBtn} (${createdRequest.requestNumber})`}
                    </button>

                    <button
                      type="button"
                      onClick={resetForAnotherRequest}
                      className="text-xs sm:text-sm font-medium text-[#F0B949] hover:text-white underline underline-offset-4 cursor-pointer ml-auto"
                    >
                      {t.wizard.submitAnotherBtn}
                    </button>
                  </div>
                </div>
              )}

              {paymentError && (
                <div
                  role="alert"
                  className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800 flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{paymentError}</span>
                  {(!personalDone || !serviceFormDone) && (
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToWindow(2, !personalDone ? 'subwindow-personal' : 'subwindow-service-boxes')
                      }
                      className="text-xs font-bold underline underline-offset-2 text-rose-900 cursor-pointer"
                    >
                      {t.scrolling.backToPersonalBtn}
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-neutral-600">{t.scrolling.window3Sub}</p>

              <form onSubmit={handleCompletePaymentAndSave} className="space-y-6">
                {/* Explicit Fee Formula Box */}
                <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      {t.wizard.origFeeRow} ({quantity} × {money(selectedService?.originalFee || 0)})
                    </span>
                    <span className="font-mono tabular-nums text-[#0A0A0C]">
                      {money(pricing.originalFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">
                      {t.wizard.platformRow} ({platformPercent}%)
                    </span>
                    <span className="font-mono tabular-nums text-[#0A0A0C]">
                      {money(pricing.platformCharge)}
                    </span>
                  </div>
                  {pricing.expressFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">{t.wizard.expressRow}</span>
                      <span className="font-mono tabular-nums text-[#0A0A0C]">
                        {money(pricing.expressFee)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="font-bold text-[#0A0A0C]">{t.wizard.totalPayableNow}</span>
                    <span className="font-mono text-lg font-bold tabular-nums text-[#0A0A0C]">
                      {money(pricing.total)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#F6F6F7] border border-neutral-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-[#0A0A0C] text-white'
                        : 'text-neutral-600 hover:text-[#0A0A0C]'
                    }`}
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>{t.wizard.payMethodUpi}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-[#0A0A0C] text-white'
                        : 'text-neutral-600 hover:text-[#0A0A0C]'
                    }`}
                  >
                    <Landmark className="w-4 h-4 shrink-0" />
                    <span>{t.wizard.payMethodBank}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-[#0A0A0C] text-white'
                        : 'text-neutral-600 hover:text-[#0A0A0C]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>{t.wizard.payMethodCard}</span>
                  </button>
                </div>

                {/* Gateway Instructions + Official QR */}
                <div className="p-5 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-4">
                  {paymentMethod === 'upi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white border border-neutral-200 rounded-xl">
                        {!qrImgFailed ? (
                          <img
                            src="/assets/aistudio/de656136-9551-4594-9a3c-9c55e9adb9f0_image_70a55a80.png"
                            alt={`Scan and pay to UPI ${settings.upiId}`}
                            referrerPolicy="no-referrer"
                            onError={() => setQrImgFailed(true)}
                            className="w-48 h-auto max-h-60 object-contain rounded"
                          />
                        ) : (
                          <QrPaymentMatrix value={upiUri} size={140} />
                        )}
                        <span className="mt-2 font-mono text-[11px] font-semibold text-[#0A0A0C]">
                          {settings.upiId}
                        </span>
                      </div>

                      <div className="sm:col-span-7 space-y-3">
                        <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider">
                          {t.wizard.officialQrHeading}
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {t.wizard.scanQrInstruction}
                        </p>

                        <div className="p-3 bg-white border border-neutral-200 rounded-lg flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-[#0A0A0C] break-all">
                            {settings.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(settings.upiId, 'upi')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0A0A0C] bg-[#FEF7E6] hover:bg-[#F0B949] border border-[#E5A93B] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedId === 'upi' ? t.wizard.copiedUpi : t.wizard.copyUpi}
                          </button>
                        </div>

                        <div className="text-xs text-neutral-600 space-y-1">
                          <div>
                            {t.wizard.payeeLabel}{' '}
                            <span className="font-medium text-[#0A0A0C]">
                              {settings.upiPayeeName}
                            </span>
                          </div>
                          <div>
                            {t.wizard.exactAmountLabel}{' '}
                            <span className="font-mono font-bold text-[#0A0A0C] tabular-nums">
                              {money(pricing.total)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <a
                            href={upiUri}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#E5A93B]" />
                            {t.wizard.openUpiApp} ({money(pricing.total)})
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-neutral-500">
                        Direct Bank Transfer (NEFT / IMPS / RTGS)
                      </div>
                      <div className="font-mono text-sm text-[#0A0A0C] bg-white p-3 border border-neutral-200 rounded-lg">
                        {settings.bankDetails}
                      </div>
                      <div className="text-sm text-neutral-700">
                        Beneficiary: <span className="font-medium">{settings.upiPayeeName}</span> ·
                        Transfer Exact Amount:{' '}
                        <span className="font-mono font-bold tabular-nums">
                          {money(pricing.total)}
                        </span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-neutral-500">
                        Card / Online Gateway Reference
                      </div>
                      <p className="text-sm text-neutral-700">
                        Complete your online payment of{' '}
                        <span className="font-mono font-bold tabular-nums">
                          {money(pricing.total)}
                        </span>{' '}
                        and enter your Transaction Reference / Auth Code below.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="pay-ref"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.utrLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="pay-ref"
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UTR429188301294"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="payer-name"
                      className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                      {t.wizard.payerNameLabel}
                    </label>
                    <input
                      id="payer-name"
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Name on payment account"
                      className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>
                </div>

                {/* Payment Transaction Screenshot Upload Box */}
                <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#0A0A0C]">
                        {t.wizard.paymentScreenshotTitle}
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {t.wizard.paymentScreenshotSub}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-white text-neutral-700 border border-neutral-200 rounded font-mono shrink-0">
                      JPG / JPEG / PNG / PDF · {PAYMENT_SCREENSHOT_META.maxSizeLabel}
                    </span>
                  </div>

                  {paymentScreenshot ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {paymentScreenshot.mimeType.startsWith('image/') ? (
                          <img
                            src={paymentScreenshot.url}
                            alt={t.wizard.paymentScreenshotAttached}
                            className="w-12 h-12 rounded-md object-cover border border-emerald-300 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-white border border-emerald-300 flex items-center justify-center text-rose-700 font-mono text-xs font-bold shrink-0">
                            PDF
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-emerald-900">
                            {t.wizard.paymentScreenshotAttached}
                          </div>
                          <div className="text-xs font-mono text-emerald-800 truncate max-w-[260px]">
                            {paymentScreenshot.originalName} (
                            {Math.max(1, Math.ceil(paymentScreenshot.sizeBytes / 1024))} KB)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={paymentScreenshot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0A0A0C] bg-white border border-emerald-300 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t.wizard.viewBtn}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot(null);
                            setPaymentShotError(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          {t.wizard.removeBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-dashed border-neutral-300 rounded-lg">
                      <span className="text-xs text-neutral-500">
                        {t.wizard.paymentScreenshotNone}
                      </span>
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingPaymentShot
                          ? t.wizard.uploadingBtn
                          : t.wizard.paymentScreenshotUploadBtn}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          className="hidden"
                          disabled={uploadingPaymentShot}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            e.target.value = '';
                            void handleUploadPaymentScreenshot(file);
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {paymentShotError && (
                    <p className="text-xs font-medium text-rose-700">{paymentShotError}</p>
                  )}
                </div>

                <label className="flex items-start gap-3 p-3.5 border border-neutral-200 rounded-lg cursor-pointer hover:bg-[#F6F6F7]">
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#0A0A0C] rounded cursor-pointer"
                  />
                  <span className="text-sm text-neutral-700">
                    {t.wizard.confirmPayCheckbox}{' '}
                    <strong className="font-mono tabular-nums text-[#0A0A0C]">
                      ({money(pricing.total)})
                    </strong>
                  </span>
                </label>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onJumpToWindow(2, 'subwindow-service-boxes')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t.scrolling.backToPersonalBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {submitting ? t.wizard.submittingBtn : t.scrolling.submitToSlipBtn}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* ================================================================ */}
        {/* RIGHT 4 COLUMNS: STICKY LIVE APPLICATION & FEE TRANSITION RAIL    */}
        {/* ================================================================ */}
        <aside className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 space-y-5 lg:sticky lg:top-28">
          <div>
            <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider">
              {t.wizard.liveFeeSummary}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {selectedService ? CATEGORY_TRANSLATIONS[selectedService.categoryKey][lang].title : ''}
            </div>
            <h3 className="text-base font-bold text-[#0A0A0C] mt-0.5">
              {selectedLoc ? selectedLoc.name : 'Select a service'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {processingSpeed === 'express'
                ? `${t.wizard.expressPriority} · ${selectedService?.turnaroundExpress || ''}`
                : `${t.wizard.standardDesk} · ${selectedService?.turnaroundStandard || ''}`}
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-neutral-100 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {t.wizard.origFeeRow} ({quantity} × {money(selectedService?.originalFee || 0)})
              </span>
              <span className="font-mono tabular-nums text-[#0A0A0C]">
                {money(pricing.originalFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {t.wizard.platformRow} ({platformPercent}%)
              </span>
              <span className="font-mono tabular-nums text-[#0A0A0C]">
                {money(pricing.platformCharge)}
              </span>
            </div>
            {pricing.expressFee > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">{t.wizard.expressRow}</span>
                <span className="font-mono tabular-nums text-[#0A0A0C]">
                  {money(pricing.expressFee)}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
              <span className="font-bold text-[#0A0A0C]">{t.wizard.totalPayableNow}</span>
              <span className="font-mono text-xl font-bold tabular-nums text-[#0A0A0C]">
                {money(pricing.total)}
              </span>
            </div>
          </div>

          {/* Interactive 4-Window Transition Jump Checklist */}
          <div className="pt-4 border-t border-neutral-100 space-y-1.5">
            {(
              [
                {
                  win: 1 as PortalWindowNumber,
                  label: t.scrolling.stage1Label,
                  done: Boolean(selectedService),
                  anchor: 'window-service-type',
                },
                {
                  win: 2 as PortalWindowNumber,
                  label: t.scrolling.stage2Label,
                  done: personalDone && serviceFormDone,
                  anchor: 'window-personal-details',
                },
                {
                  win: 3 as PortalWindowNumber,
                  label: t.scrolling.stage3Label,
                  done: Boolean(createdRequest),
                  anchor: 'window-payment-gateway',
                },
                {
                  win: 4 as PortalWindowNumber,
                  label: t.scrolling.stage4Label,
                  done: Boolean(createdRequest),
                  anchor: 'window-slip-tracking',
                },
              ] as const
            ).map((item) => (
              <button
                key={item.win}
                type="button"
                onClick={() => onJumpToWindow(item.win, item.anchor)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  activeWindow === item.win
                    ? 'bg-[#0A0A0C] text-white border-[#0A0A0C]'
                    : 'bg-[#F6F6F7] text-neutral-700 border-neutral-200 hover:border-[#0A0A0C]'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className={`font-mono font-bold ${
                      activeWindow === item.win ? 'text-[#E5A93B]' : 'text-[#8A5A00]'
                    }`}
                  >
                    0{item.win}.
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.done ? (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      activeWindow === item.win ? 'text-[#E5A93B]' : 'text-emerald-600'
                    }`}
                  />
                ) : (
                  <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
                )}
              </button>
            ))}
          </div>

          {(customerName || Object.keys(customDetails).length > 0) && (
            <div className="pt-4 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
              {customerName && (
                <div>
                  <span className="text-neutral-400">Applicant:</span>{' '}
                  <span className="text-[#0A0A0C] font-medium">{customerName}</span>
                </div>
              )}
              {customerWhatsapp && (
                <div>
                  <span className="text-neutral-400">Mobile:</span>{' '}
                  <span className="font-mono text-[#0A0A0C]">{customerWhatsapp}</span>
                </div>
              )}
              {Object.entries(customDetails).map(([k, v]) =>
                v ? (
                  <div key={k} className="truncate">
                    <span className="text-neutral-400">{k}:</span>{' '}
                    <span className="text-[#0A0A0C]">{v}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {selectedService && selectedService.requiredDocuments?.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-2">
              <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                {t.wizard.requiredDocsSummary} ({requiredUploadedCount}/
                {selectedService.requiredDocuments.length})
              </div>
              <ul className="space-y-1 text-xs text-neutral-600">
                {selectedService.requiredDocuments.map((doc) => {
                  const isUploaded = Boolean(uploadedDocuments[doc]);
                  const isReady = isUploaded || customerConfirmedDocuments.includes(doc);
                  return (
                    <li key={doc} className="flex items-start gap-2">
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                          isUploaded
                            ? 'bg-emerald-600'
                            : isReady
                            ? 'bg-[#D49B28]'
                            : 'bg-neutral-300'
                        }`}
                      />
                      <span className={isReady ? 'text-[#0A0A0C] font-medium' : ''}>
                        {getLocalizedDocName(doc, lang)}
                      </span>
                    </li>
                  );
                })}
                {EXTRA_OTHER_DOCUMENT_NAMES.filter((d) => Boolean(uploadedDocuments[d])).map(
                  (extraDoc) => (
                    <li key={extraDoc} className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-600" />
                      <span className="text-[#0A0A0C] font-medium">
                        {getLocalizedDocName(extraDoc, lang)}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500 leading-relaxed">
            Every service carries a transparent {platformPercent}% Platform Service Charge on top of
            the Original Fee.
          </div>
        </aside>
      </div>
    </div>
  );
};

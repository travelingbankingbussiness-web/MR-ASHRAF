import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Lock,
  LogOut,
  PackageCheck,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import type {
  BusinessSettings,
  DocumentStatus,
  PaymentDecision,
  RequestStatus,
  ServiceCategoryKey,
  ServicePackage,
  ServiceRequest,
} from '../types';
import { STANDARD_DOCUMENT_NAMES } from '../constants/documents';
import {
  computePlatformCharge,
  formatCurrency,
  formatDateTime,
  formatPaymentMethodLabel,
  getPaymentStatusMeta,
  getStatusMeta,
} from '../utils/whatsapp';
import { OfficialSlipCard } from './OfficialSlipCard';
import { DirectChatBox } from './DirectChatBox';

interface OwnerDeskViewProps {
  onSettingsUpdated: () => void;
}

type AdminTab = 'queue' | 'settings';

const CATEGORY_OPTIONS: { key: ServiceCategoryKey; title: string; titleHi: string }[] = [
  { key: 'identity_certificates', title: 'Identity & Certificates', titleHi: 'पहचान और प्रमाण पत्र' },
  { key: 'banking_finance', title: 'Banking & Financial Services', titleHi: 'बैंकिंग और वित्तीय सेवाएं' },
  { key: 'govt_schemes', title: 'Government Schemes', titleHi: 'सरकारी योजनाएं' },
  { key: 'education_jobs', title: 'Education & Jobs', titleHi: 'शिक्षा और रोजगार' },
  { key: 'business_travel', title: 'Business & Travel', titleHi: 'व्यापार, यात्रा और अन्य सेवाएं' },
];

export const OwnerDeskView: React.FC<OwnerDeskViewProps> = ({ onSettingsUpdated }) => {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [activePasscode, setActivePasscode] = useState<string>(() => {
    try {
      return sessionStorage.getItem('owner_passcode') || '';
    } catch {
      return '';
    }
  });
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [adminTab, setAdminTab] = useState<AdminTab>('queue');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [services, setServices] = useState<ServicePackage[]>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Payment Decision & Required Documents Check state
  const [paymentReviewNote, setPaymentReviewNote] = useState('');
  const [docsChecklist, setDocsChecklist] = useState<Record<string, DocumentStatus>>({});
  const [docsReviewNote, setDocsReviewNote] = useState('');

  // Action states for selected request
  const [checkDetails, setCheckDetails] = useState(false);
  const [checkSpecs, setCheckSpecs] = useState(false);
  const [checkPayment, setCheckPayment] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');

  const [handlerName, setHandlerName] = useState('');
  const [deskCounter, setDeskCounter] = useState('Main Service Counter');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
  const [finalRemarks, setFinalRemarks] = useState('');

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  // New Service Form
  const [newSrvCat, setNewSrvCat] = useState<ServiceCategoryKey>('identity_certificates');
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvNameHi, setNewSrvNameHi] = useState('');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvDocs, setNewSrvDocs] = useState<string[]>([
    'Proof of Identity',
    'Proof of Address',
    'Applicant Photo (Max 1 MB)',
  ]);
  const [newSrvOrigFee, setNewSrvOrigFee] = useState(100);
  const [newSrvExpressFee, setNewSrvExpressFee] = useState(50);

  const fetchAdminData = async (pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/requests', {
        headers: { 'x-owner-passcode': pass },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setRequests(data.requests || []);
      setSettings(data.settings);
      setServices(data.services || []);
      setUnlocked(true);
      try {
        sessionStorage.setItem('owner_passcode', pass);
      } catch {
        // Ignore storage restrictions
      }
      if (!selectedId && data.requests?.length > 0) {
        setSelectedId(data.requests[0].id);
      }
    } catch (err) {
      setUnlocked(false);
      setAuthError(err instanceof Error ? err.message : 'Unable to unlock Owner Desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePasscode) {
      fetchAdminData(activePasscode);
    }
  }, []);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  useEffect(() => {
    if (!selectedRequest) return;
    setPaymentReviewNote(selectedRequest.paymentReviewNote || '');
    const initialDocs: Record<string, DocumentStatus> = {};
    const allDocKeys = Array.from(
      new Set([
        ...(selectedRequest.requiredDocuments || []),
        ...Object.keys(selectedRequest.uploadedDocuments || {}),
      ])
    );
    for (const d of allDocKeys) {
      initialDocs[d] = selectedRequest.documentsChecklist?.[d] || 'pending';
    }
    setDocsChecklist(initialDocs);
    setDocsReviewNote(selectedRequest.documentsReviewNote || '');

    setCheckDetails(selectedRequest.verification.detailsVerified);
    setCheckSpecs(selectedRequest.verification.specsVerified);
    setCheckPayment(selectedRequest.verification.paymentVerified);
    setVerifyNotes(selectedRequest.verification.verificationNotes || '');
    setHandlerName(
      selectedRequest.physicalProcessing.handlerName || settings?.ownerName || 'Mr. Ashraf'
    );
    setDeskCounter(selectedRequest.physicalProcessing.deskCounter || 'Main CSC Counter');
    setExpectedCompletion(
      selectedRequest.physicalProcessing.expectedCompletion || new Date().toISOString().slice(0, 10)
    );
    setProcessingNotes(selectedRequest.physicalProcessing.processingNotes || '');
    setFinalRemarks(
      selectedRequest.slip?.finalRemarks ||
        'All submitted details and fee payment verified. Physical processing completed and official slip issued.'
    );
    setActionErr(null);
    setActionMsg(null);
  }, [selectedRequest?.id, settings?.ownerName]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'rejected') {
          if (req.status !== 'rejected' && req.paymentStatus !== 'rejected') return false;
        } else if (statusFilter === 'payment_submitted') {
          if (req.status !== 'payment_submitted' && req.paymentStatus !== 'pending') return false;
        } else if (req.status !== statusFilter) {
          return false;
        }
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.requestNumber.toLowerCase().includes(q) ||
        req.customerName.toLowerCase().includes(q) ||
        req.customerWhatsapp.includes(q) ||
        req.paymentReference.toLowerCase().includes(q) ||
        req.serviceName.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePasscode(passcodeInput);
    fetchAdminData(passcodeInput);
  };

  const handlePaymentDecision = async (decision: PaymentDecision) => {
    if (!selectedRequest) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          paymentStatus: decision,
          paymentReviewNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update payment decision.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setCheckPayment(data.request.verification.paymentVerified);
      setCheckDetails(data.request.verification.detailsVerified);
      setCheckSpecs(data.request.verification.specsVerified);
      const label =
        decision === 'approved'
          ? 'Payment Approved & Application Verified.'
          : decision === 'rejected'
          ? 'Payment / Application Marked Rejected.'
          : 'Payment Status Set to Pending Review.';
      setActionMsg(label);
      onSettingsUpdated();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error updating payment decision.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveDocumentsCheck = async () => {
    if (!selectedRequest) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/documents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          documentsChecklist: docsChecklist,
          documentsReviewNote: docsReviewNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save required documents checklist.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setActionMsg('Required Documents verification checklist saved.');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error saving document checklist.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRequest) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          detailsVerified: checkDetails,
          specsVerified: checkSpecs,
          paymentVerified: checkPayment,
          verificationNotes: verifyNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setActionMsg('Details & fee payment verified as correct.');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error verifying request.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleStartPhysicalProcessing = async () => {
    if (!selectedRequest) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/process`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          handlerName,
          deskCounter,
          expectedCompletion,
          processingNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update processing state.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setActionMsg('Physical processing started and logged.');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error updating processing status.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleGenerateSlip = async () => {
    if (!selectedRequest) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${selectedRequest.id}/slip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          handlerName,
          deskCounter,
          processingNotes,
          finalRemarks,
          transferInChat: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate slip.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setActionMsg(
        `Official Slip ${data.request.slip.slipNumber} generated and transferred to Customer Chat & Track.`
      );
      onSettingsUpdated();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error generating slip.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleRequestRealtimeUpdate = (updated: ServiceRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleGenerateAndTransferSlip = async (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/slip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          handlerName: handlerName || settings?.ownerName || 'Mr. Ashraf',
          deskCounter: deskCounter || 'Main CSC Counter',
          processingNotes:
            processingNotes || 'All service details and missed documents checked.',
          finalRemarks:
            finalRemarks ||
            'All done! Details & documents verified, official slip generated and transferred.',
          transferInChat: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate and transfer slip.');
      setRequests((prev) => prev.map((r) => (r.id === data.request.id ? data.request : r)));
      setActionMsg(
        `All Done! Official Slip ${data.request.slip.slipNumber} generated and transferred in chat.`
      );
      onSettingsUpdated();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Error transferring slip.');
      throw err;
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setBusyAction(true);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'DELETE',
        headers: { 'x-owner-passcode': activePasscode },
      });
      if (res.ok) {
        const remaining = requests.filter((r) => r.id !== id);
        setRequests(remaining);
        setSelectedId(remaining[0]?.id || null);
        onSettingsUpdated();
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({ settings, services }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
      setSettings(data.settings);
      setServices(data.services);
      setActivePasscode(data.settings.ownerPasscode);
      try {
        sessionStorage.setItem('owner_passcode', data.settings.ownerPasscode);
      } catch {
        // Ignore storage errors
      }
      setActionMsg('Admin Platform settings and service fees updated.');
      onSettingsUpdated();
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleAddService = () => {
    if (!newSrvName.trim()) return;
    const catObj =
      CATEGORY_OPTIONS.find((c) => c.key === newSrvCat) || CATEGORY_OPTIONS[0];
    const added: ServicePackage = {
      id: `srv-${Date.now().toString(36)}`,
      categoryKey: catObj.key,
      categoryTitle: catObj.title,
      categoryTitleHi: catObj.titleHi,
      name: newSrvName.trim(),
      nameHi: newSrvNameHi.trim() || newSrvName.trim(),
      description: newSrvDesc.trim() || 'Citizen desk service processing and slip issuance.',
      originalFee: Math.max(0, Number(newSrvOrigFee) || 0),
      expressAddonFee: Math.max(0, Number(newSrvExpressFee) || 0),
      turnaroundStandard: '2–3 Working Days',
      turnaroundExpress: 'Same Day',
      requiredHints: ['Applicant details', 'Reference details'],
      requiredDocuments: newSrvDocs,
      customFields: [
        {
          key: 'Application Details',
          label: 'Primary Application Reference / Details',
          placeholder: 'Enter details',
          type: 'text',
          required: true,
        },
      ],
      active: true,
    };
    setServices((prev) => [...prev, added]);
    setNewSrvName('');
    setNewSrvNameHi('');
    setNewSrvDesc('');
  };

  const handleLockAdmin = () => {
    setUnlocked(false);
    setPasscodeInput('');
    setActivePasscode('');
    try {
      sessionStorage.removeItem('owner_passcode');
    } catch {
      // Ignore storage errors
    }
  };

  if (!unlocked) {
    return (
      <section className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-[#0A0A0C] text-white px-8 py-5 border-b-2 border-[#D49B28] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#E5A93B] flex items-center justify-center text-[#0A0A0C] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Platform Sign In</h1>
              <div className="text-xs text-[#F0B949]">Mr Ashraf Banking Traveling Communication</div>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <p className="text-sm text-neutral-600">
              Enter your Admin Passcode Key to verify customer submissions, inspect fee payments, manage physical processing, and generate official slips.
            </p>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {authError}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label htmlFor="owner-pass" className="block text-sm font-medium text-[#0A0A0C] mb-1.5">
                  Admin Passcode Key
                </label>
                <input
                  id="owner-pass"
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter Admin Passcode Key"
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors cursor-pointer"
              >
                {loading ? 'Verifying Passcode...' : 'Unlock Admin Platform'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  const platformPercent = settings?.platformChargePercent ?? 20;
  const pendingCount = requests.filter(
    (r) => r.paymentStatus === 'pending' || r.status === 'payment_submitted'
  ).length;
  const approvedCount = requests.filter(
    (r) => r.paymentStatus === 'approved' && r.status !== 'rejected'
  ).length;
  const slipsCount = requests.filter((r) => r.status === 'slip_issued').length;
  const rejectedCount = requests.filter(
    (r) => r.paymentStatus === 'rejected' || r.status === 'rejected'
  ).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Workspace Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0C]">
            Admin Platform — Payment, Documents &amp; Slip Desk
          </h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Check fee + {platformPercent}% platform charge payments (Approve / Pending / Reject), verify Required Documents, manage physical processing, and issue official slips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-neutral-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAdminTab('queue');
                setActionMsg(null);
                setActionErr(null);
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'queue'
                  ? 'bg-[#0A0A0C] text-[#F0B949]'
                  : 'text-neutral-700 hover:text-[#0A0A0C]'
              }`}
            >
              Applications ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminTab('settings');
                setActionMsg(null);
                setActionErr(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminTab === 'settings'
                  ? 'bg-[#0A0A0C] text-[#F0B949]'
                  : 'text-neutral-700 hover:text-[#0A0A0C]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings &amp; Docs</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLockAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0A0A0C] bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Admin
          </button>
        </div>
      </div>

      {/* Admin KPI Overview Strip */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Pending Payment Check</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-[#8A5A00] mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Payment Approved</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0C] mt-1">
            {approvedCount}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Official Slips Issued</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-emerald-700 mt-1">
            {slipsCount}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Rejected Applications</div>
          <div className="font-mono text-2xl font-bold tabular-nums text-rose-700 mt-1">
            {rejectedCount}
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
          {actionMsg}
        </div>
      )}
      {actionErr && (
        <div className="no-print p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
          {actionErr}
        </div>
      )}

      {adminTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Queue List */}
          <div className="no-print lg:col-span-4 bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 space-y-3 bg-[#0A0A0C]">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, name, phone, UTR..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-[#0A0A0C] border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E5A93B]"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'payment_submitted', label: 'Pending' },
                    { id: 'verified', label: 'Approved' },
                    { id: 'processing_physically', label: 'Processing' },
                    { id: 'slip_issued', label: 'Slip Issued' },
                    { id: 'rejected', label: 'Rejected' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-[#E5A93B] text-[#0A0A0C] font-semibold'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[680px] overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No requests match this filter.
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = req.id === selectedId;
                  const meta = getStatusMeta(req.status);
                  const payMeta = getPaymentStatusMeta(req.paymentStatus || 'pending');
                  const reqDocs = req.requiredDocuments || [];
                  const verifiedDocsCount = reqDocs.filter(
                    (d) => req.documentsChecklist?.[d] === 'verified'
                  ).length;
                  return (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedId(req.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEF7E6] border-l-4 border-[#D49B28]'
                          : 'bg-white hover:bg-[#F6F6F7]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#8A5A00]">
                          {req.requestNumber}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 border rounded ${payMeta.badgeClass}`}
                        >
                          {payMeta.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#0A0A0C] mt-1.5">
                        {req.customerName}
                      </div>
                      <div className="text-xs text-neutral-600 truncate">{req.serviceName}</div>
                      <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-mono">UTR: {req.paymentReference}</span>
                        <span className="font-mono font-bold tabular-nums text-[#0A0A0C]">
                          {formatCurrency(req.totalAmount, req.currencySymbol)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-500">
                        <span>{meta.label}</span>
                        <span className="font-mono tabular-nums">
                          Docs: {verifiedDocsCount}/{reqDocs.length}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Inspection & Action Workspace */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedRequest ? (
              <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-sm text-neutral-500">
                Select a customer request from the left queue to inspect details and generate a slip.
              </div>
            ) : (
              <>
                <div className="no-print bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
                  {/* Top Summary */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-neutral-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="font-mono font-bold text-[#8A5A00]">
                          {selectedRequest.requestNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedRequest.serviceCategory}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateTime(selectedRequest.createdAt)}</span>
                      </div>
                      <h2 className="text-lg font-bold text-[#0A0A0C] mt-1">
                        {selectedRequest.serviceName}
                      </h2>
                      <p className="text-sm text-neutral-600">
                        {selectedRequest.customerName} · +{selectedRequest.customerWhatsapp} ·{' '}
                        {selectedRequest.customerCity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">
                          Orig {formatCurrency(selectedRequest.originalFee, selectedRequest.currencySymbol)} + {selectedRequest.platformChargePercent}% ({formatCurrency(selectedRequest.platformCharge, selectedRequest.currencySymbol)})
                        </div>
                        <div className="font-mono text-lg font-bold tabular-nums text-[#0A0A0C]">
                          {formatCurrency(selectedRequest.totalAmount, selectedRequest.currencySymbol)}
                        </div>
                        <div className="font-mono text-xs text-neutral-600">
                          {formatPaymentMethodLabel(selectedRequest.paymentMethod)} · Ref:{' '}
                          {selectedRequest.paymentReference}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(selectedRequest.id)}
                        title="Delete request"
                        className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Full Customer & Service Detail Readout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-[#F6F6F7] border border-neutral-200 rounded-lg p-4">
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-[#8A5A00] uppercase">
                        Customer Contact &amp; Address
                      </div>
                      <div>
                        <span className="text-neutral-500">Name:</span>{' '}
                        <span className="font-medium text-[#0A0A0C]">
                          {selectedRequest.customerName}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Mobile:</span>{' '}
                        <span className="font-mono text-[#0A0A0C]">
                          +{selectedRequest.customerWhatsapp}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Address:</span>{' '}
                        <span className="text-[#0A0A0C]">
                          {selectedRequest.customerAddress}, {selectedRequest.customerCity}{' '}
                          {selectedRequest.customerPostalCode}
                        </span>
                      </div>
                      {selectedRequest.customerEmail && (
                        <div>
                          <span className="text-neutral-500">Email:</span>{' '}
                          <span className="text-[#0A0A0C]">{selectedRequest.customerEmail}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-[#8A5A00] uppercase">
                        Filled Service Form Boxes
                      </div>
                      <div>
                        <span className="text-neutral-500">Subject:</span>{' '}
                        <span className="font-medium text-[#0A0A0C]">
                          {selectedRequest.subjectTitle} (Qty {selectedRequest.quantity})
                        </span>
                      </div>
                      {Object.entries(selectedRequest.customDetails || {}).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-neutral-500">{k}:</span>{' '}
                          <span className="font-medium text-[#0A0A0C]">{v}</span>
                        </div>
                      ))}
                      <div>
                        <span className="text-neutral-500">Preferred Date:</span>{' '}
                        <span className="font-mono text-[#0A0A0C]">
                          {selectedRequest.preferredDate}
                        </span>
                      </div>
                      {selectedRequest.detailedInstructions && (
                        <div>
                          <span className="text-neutral-500">Notes:</span>{' '}
                          <span className="text-[#0A0A0C]">
                            {selectedRequest.detailedInstructions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHECK PAYMENT DETAILS & APPROVED / PENDING / REJECTED DECISION */}
                  <div className="border border-neutral-200 rounded-xl p-5 space-y-4 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#0A0A0C] flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#8A5A00]" />
                        Check Payment Details &amp; Decision
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 border rounded-md ${
                          getPaymentStatusMeta(selectedRequest.paymentStatus || 'pending').badgeClass
                        }`}
                      >
                        {getPaymentStatusMeta(selectedRequest.paymentStatus || 'pending').label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg text-xs">
                      <div>
                        <div className="text-neutral-500">Payment Method</div>
                        <div className="font-semibold text-[#0A0A0C] mt-0.5">
                          {formatPaymentMethodLabel(selectedRequest.paymentMethod)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">UTR / Transaction ID</div>
                        <div className="font-mono font-bold text-[#0A0A0C] mt-0.5 break-all">
                          {selectedRequest.paymentReference}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Payer Account Name</div>
                        <div className="font-semibold text-[#0A0A0C] mt-0.5">
                          {selectedRequest.payerName || selectedRequest.customerName}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Paid At</div>
                        <div className="font-mono text-[#0A0A0C] mt-0.5">
                          {formatDateTime(selectedRequest.paymentCompletedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Original Service Fee</div>
                        <div className="font-mono font-semibold tabular-nums text-[#0A0A0C] mt-0.5">
                          {formatCurrency(selectedRequest.originalFee, selectedRequest.currencySymbol)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">
                          {selectedRequest.platformChargePercent}% Platform Charge
                        </div>
                        <div className="font-mono font-semibold tabular-nums text-[#0A0A0C] mt-0.5">
                          {formatCurrency(selectedRequest.platformCharge, selectedRequest.currencySymbol)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Express Priority Fee</div>
                        <div className="font-mono font-semibold tabular-nums text-[#0A0A0C] mt-0.5">
                          {formatCurrency(selectedRequest.expressFee, selectedRequest.currencySymbol)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Total Amount Paid</div>
                        <div className="font-mono text-sm font-bold tabular-nums text-emerald-800 mt-0.5">
                          {formatCurrency(selectedRequest.totalAmount, selectedRequest.currencySymbol)}
                        </div>
                      </div>
                    </div>

                    {/* Customer Attached Payment Screenshot for Verification */}
                    <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg">
                      <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider mb-2">
                        Customer Payment Transaction Screenshot
                      </div>
                      {selectedRequest.paymentScreenshot ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-emerald-200 rounded-lg p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {selectedRequest.paymentScreenshot.mimeType?.startsWith('image/') ? (
                              <a
                                href={selectedRequest.paymentScreenshot.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 block"
                                title="Click to view full payment screenshot"
                              >
                                <img
                                  src={selectedRequest.paymentScreenshot.url}
                                  alt="Customer Payment Screenshot"
                                  className="w-16 h-16 rounded-md object-cover border border-neutral-300 bg-white hover:opacity-90 transition-opacity"
                                />
                              </a>
                            ) : (
                              <div className="w-16 h-16 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center font-mono text-xs font-bold text-rose-700 shrink-0">
                                PDF
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-emerald-900 truncate max-w-[260px]">
                                {selectedRequest.paymentScreenshot.originalName}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-600 tabular-nums mt-0.5">
                                {Math.max(
                                  1,
                                  Math.ceil((selectedRequest.paymentScreenshot.sizeBytes || 0) / 1024)
                                )}{' '}
                                KB · Uploaded {formatDateTime(selectedRequest.paymentScreenshot.uploadedAt)}
                              </div>
                            </div>
                          </div>

                          <a
                            href={selectedRequest.paymentScreenshot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A0A0C] bg-[#FEF7E6] hover:bg-[#F0B949] border border-[#E5A93B] rounded-md transition-colors whitespace-nowrap shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Full Screenshot
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 bg-white border border-neutral-200 rounded-lg px-3 py-2.5">
                          No payment screenshot attached by customer. Verify using UTR / Transaction ID above.
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Payment Check Remark / Rejection Reason (visible on customer Track page)
                        </label>
                        <input
                          type="text"
                          value={paymentReviewNote}
                          onChange={(e) => setPaymentReviewNote(e.target.value)}
                          placeholder="e.g. UTR matched on 8755106587@ptsbi / Wrong UTR or unpaid amount"
                          className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handlePaymentDecision('approved')}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedRequest.paymentStatus === 'approved'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approved
                        </button>

                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handlePaymentDecision('pending')}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedRequest.paymentStatus === 'pending'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          Pending
                        </button>

                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handlePaymentDecision('rejected')}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selectedRequest.paymentStatus === 'rejected'
                              ? 'bg-rose-700 text-white'
                              : 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* REQUIRED DOCUMENTS VERIFICATION */}
                  {(() => {
                    const inspectionDocNames = Array.from(
                      new Set([
                        ...(selectedRequest.requiredDocuments || []),
                        ...Object.keys(selectedRequest.uploadedDocuments || {}),
                      ])
                    );

                    return (
                  <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#0A0A0C] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8A5A00]" />
                        Required &amp; Extra Documents Verification
                      </h3>
                      <span className="text-xs font-mono text-neutral-600 tabular-nums">
                        {inspectionDocNames.filter((d) => docsChecklist[d] === 'verified').length}/
                        {inspectionDocNames.length} Verified
                      </span>
                    </div>

                    {inspectionDocNames.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No required documents configured for this service.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {inspectionDocNames.map((docName) => {
                          const docStatus = docsChecklist[docName] || 'pending';
                          const customerMarkedReady = (
                            selectedRequest.customerConfirmedDocuments || []
                          ).includes(docName);
                          const uploaded = selectedRequest.uploadedDocuments?.[docName];
                          const extraLabel =
                            docName === 'Other Document 1 (Optional)'
                              ? selectedRequest.customDetails?.['Other Document 1 Name']
                              : docName === 'Other Document 2 (Optional)'
                              ? selectedRequest.customDetails?.['Other Document 2 Name']
                              : undefined;
                          return (
                            <div
                              key={docName}
                              className="p-3 bg-[#F6F6F7] border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex items-start gap-3">
                                {uploaded && uploaded.mimeType?.startsWith('image/') && (
                                  <img
                                    src={uploaded.url}
                                    alt={docName}
                                    className="w-10 h-10 rounded object-cover border border-neutral-300 bg-white shrink-0"
                                  />
                                )}
                                {uploaded && !uploaded.mimeType?.startsWith('image/') && (
                                  <div className="w-10 h-10 rounded bg-white border border-neutral-300 flex items-center justify-center font-mono text-[10px] font-bold text-rose-700 shrink-0">
                                    PDF
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-[#0A0A0C]">
                                    {docName}
                                    {extraLabel ? (
                                      <span className="ml-1.5 text-xs font-normal text-neutral-600">
                                        ({extraLabel})
                                      </span>
                                    ) : null}
                                  </div>
                                  {uploaded ? (
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-800 mt-0.5">
                                      <span className="font-mono truncate max-w-[180px]">
                                        {uploaded.originalName} ({Math.max(1, Math.ceil(uploaded.sizeBytes / 1024))} KB)
                                      </span>
                                      <a
                                        href={uploaded.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-semibold text-[#8A5A00] hover:text-[#0A0A0C] underline underline-offset-2"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        View File
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-neutral-500 mt-0.5">
                                      {customerMarkedReady
                                        ? 'Not uploaded · Customer ticked Ready at counter'
                                        : 'Not uploaded by customer'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {(
                                  [
                                    {
                                      val: 'verified',
                                      label: 'Verified',
                                      activeCls: 'bg-emerald-700 text-white border-emerald-700',
                                    },
                                    {
                                      val: 'pending',
                                      label: 'Pending',
                                      activeCls: 'bg-amber-600 text-white border-amber-600',
                                    },
                                    {
                                      val: 'missing',
                                      label: 'Missing',
                                      activeCls: 'bg-rose-700 text-white border-rose-700',
                                    },
                                  ] as const
                                ).map((opt) => (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() =>
                                      setDocsChecklist((prev) => ({
                                        ...prev,
                                        [docName]: opt.val,
                                      }))
                                    }
                                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                                      docStatus === opt.val
                                        ? opt.activeCls
                                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={docsReviewNote}
                        onChange={(e) => setDocsReviewNote(e.target.value)}
                        placeholder="Document check remark (e.g. Bring original Aadhaar & Ration copy)"
                        className="flex-1 px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleSaveDocumentsCheck}
                        className="px-4 py-2 text-sm font-semibold text-[#F0B949] bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Save Document Check
                      </button>
                    </div>
                  </div>
                    );
                  })()}

                  {/* DIRECT ADMIN <-> CUSTOMER CHAT BOX (UNLOCKED FOR APPROVED/PENDING, LOCKED FOR REJECTED) */}
                  <DirectChatBox
                    role="admin"
                    request={selectedRequest}
                    adminPasscode={activePasscode}
                    ownerName={settings?.ownerName}
                    onRequestUpdated={handleRequestRealtimeUpdate}
                    onGenerateAndTransferSlip={handleGenerateAndTransferSlip}
                    onPrintSlipClick={() => window.print()}
                  />

                  {/* STAGE 1: FULL CHECKLIST CONFIRMATION */}
                  <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0A0A0C] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8A5A00]" />
                        Stage 1: Confirm All Details &amp; Boxes Correct
                      </h3>
                      {selectedRequest.verification.verifiedAt && (
                        <span className="text-xs font-medium text-emerald-700">
                          Verified {formatDateTime(selectedRequest.verification.verifiedAt)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2.5 p-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 cursor-pointer hover:bg-[#F6F6F7]">
                        <input
                          type="checkbox"
                          checked={checkDetails}
                          onChange={(e) => setCheckDetails(e.target.checked)}
                          className="w-4 h-4 accent-[#0A0A0C]"
                        />
                        Customer Details Valid
                      </label>
                      <label className="flex items-center gap-2.5 p-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 cursor-pointer hover:bg-[#F6F6F7]">
                        <input
                          type="checkbox"
                          checked={checkSpecs}
                          onChange={(e) => setCheckSpecs(e.target.checked)}
                          className="w-4 h-4 accent-[#0A0A0C]"
                        />
                        Service Boxes Complete
                      </label>
                      <label className="flex items-center gap-2.5 p-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 cursor-pointer hover:bg-[#F6F6F7]">
                        <input
                          type="checkbox"
                          checked={checkPayment}
                          onChange={(e) => setCheckPayment(e.target.checked)}
                          className="w-4 h-4 accent-[#0A0A0C]"
                        />
                        Fee + 20% UTR Matched
                      </label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={verifyNotes}
                        onChange={(e) => setVerifyNotes(e.target.value)}
                        placeholder="Verification note (e.g. All details and UTR matched)"
                        className="flex-1 px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleVerify}
                        className="px-4 py-2 text-sm font-semibold text-[#F0B949] bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Confirm Checked &amp; Correct
                      </button>
                    </div>
                  </div>

                  {/* STAGE 2: PHYSICAL PROCESSING */}
                  <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#0A0A0C] flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-[#8A5A00]" />
                        Stage 2: Physical Processing Desk
                      </h3>
                      {selectedRequest.physicalProcessing.startedAt && (
                        <span className="text-xs font-medium text-[#8A5A00]">
                          Started {formatDateTime(selectedRequest.physicalProcessing.startedAt)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Handler / Operator Name
                        </label>
                        <input
                          type="text"
                          value={handlerName}
                          onChange={(e) => setHandlerName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Physical Counter / Desk
                        </label>
                        <input
                          type="text"
                          value={deskCounter}
                          onChange={(e) => setDeskCounter(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Expected Ready Date
                        </label>
                        <input
                          type="date"
                          value={expectedCompletion}
                          onChange={(e) => setExpectedCompletion(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={processingNotes}
                        onChange={(e) => setProcessingNotes(e.target.value)}
                        placeholder="Physical processing note (e.g. Form submitted, biometric/seal done)"
                        className="flex-1 px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleStartPhysicalProcessing}
                        className="px-4 py-2 text-sm font-semibold text-[#0A0A0C] bg-[#FEF7E6] border border-[#D49B28] hover:bg-[#E5A93B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Mark Processing Physically
                      </button>
                    </div>
                  </div>

                  {/* STAGE 3: GENERATE OFFICIAL SLIP */}
                  <div className="border-2 border-[#D49B28] bg-[#FEF7E6]/60 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-[#0A0A0C] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#8A5A00]" />
                      Stage 3: Generate Official Slip
                    </h3>
                    {selectedRequest.paymentStatus === 'rejected' && (
                      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        This payment is currently marked Rejected. Change Payment Decision to Approved before generating a slip.
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={finalRemarks}
                        onChange={(e) => setFinalRemarks(e.target.value)}
                        placeholder="Final remarks printed on customer slip..."
                        className="flex-1 px-3.5 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleGenerateSlip}
                        className="px-5 py-2 text-sm font-bold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {selectedRequest.slip
                          ? 'Update Slip Remarks'
                          : 'Complete & Generate Official Slip'}
                      </button>
                    </div>

                    {selectedRequest.slip && (
                      <p className="text-xs text-[#0A0A0C]">
                        Slip <strong>{selectedRequest.slip.slipNumber}</strong> is now active on the customer Track &amp; Slip page and ready for PDF printing below.
                      </p>
                    )}
                  </div>
                </div>

                {selectedRequest.slip && settings && (
                  <OfficialSlipCard request={selectedRequest} settings={settings} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {adminTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#0A0A0C]">
                Center, Fee Percentage &amp; Payment Settings
              </h2>
              <p className="text-sm text-neutral-600 mt-0.5">
                Configure your center details, merchant UPI ID, platform charge percentage, and Admin Passcode Key.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Business / Center Name
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Admin / Operator Name
                </label>
                <input
                  type="text"
                  value={settings.ownerName}
                  onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Center Helpline Mobile (with Country Code)
                </label>
                <input
                  type="text"
                  value={settings.ownerWhatsapp}
                  onChange={(e) => setSettings({ ...settings, ownerWhatsapp: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Platform Service Charge (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.platformChargePercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      platformChargePercent: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  UPI ID (for Customer QR &amp; Payment)
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  UPI Payee Name
                </label>
                <input
                  type="text"
                  value={settings.upiPayeeName}
                  onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Admin Passcode Key
                </label>
                <input
                  type="password"
                  value={settings.ownerPasscode}
                  onChange={(e) => setSettings({ ...settings, ownerPasscode: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Bank Transfer Details
                </label>
                <input
                  type="text"
                  value={settings.bankDetails}
                  onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Center Physical Address
                </label>
                <input
                  type="text"
                  value={settings.officeAddress}
                  onChange={(e) => setSettings({ ...settings, officeAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                />
              </div>
            </div>
          </div>

          {/* Service Fees Catalog */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#0A0A0C]">
                Service Original Fees &amp; {settings.platformChargePercent}% Platform Service Charge
              </h2>
              <p className="text-sm text-neutral-600 mt-0.5">
                Adjust any service&apos;s Original Fee below; the {settings.platformChargePercent}% Platform Charge calculates automatically.
              </p>
            </div>

            <div className="space-y-3">
              {services.map((srv, idx) => {
                const charge = computePlatformCharge(
                  srv.originalFee,
                  settings.platformChargePercent
                );
                return (
                  <div
                    key={srv.id}
                    className="p-4 border border-neutral-200 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                  >
                    <div className="md:col-span-5">
                      <div className="text-[11px] font-medium text-[#8A5A00] mb-1">
                        {srv.categoryTitleHi} · {srv.categoryTitle}
                      </div>
                      <input
                        type="text"
                        value={srv.name}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx] = { ...srv, name: e.target.value };
                          setServices(next);
                        }}
                        className="w-full px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        Original Fee ({settings.currencySymbol})
                      </label>
                      <input
                        type="number"
                        value={srv.originalFee}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx] = { ...srv, originalFee: Number(e.target.value) || 0 };
                          setServices(next);
                        }}
                        className="w-full px-3 py-1.5 text-sm font-mono tabular-nums border border-neutral-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">
                        +{settings.platformChargePercent}% Charge / Total
                      </label>
                      <div className="px-3 py-1.5 text-sm font-mono tabular-nums bg-[#F6F6F7] border border-neutral-200 rounded-md text-[#0A0A0C]">
                        {formatCurrency(charge, settings.currencySymbol)} →{' '}
                        <strong>
                          {formatCurrency(srv.originalFee + charge, settings.currencySymbol)}
                        </strong>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-neutral-500 mb-1">Express Add-on</label>
                      <input
                        type="number"
                        value={srv.expressAddonFee}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx] = { ...srv, expressAddonFee: Number(e.target.value) || 0 };
                          setServices(next);
                        }}
                        className="w-full px-3 py-1.5 text-sm font-mono tabular-nums border border-neutral-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-end pb-1">
                      <label className="inline-flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={srv.active}
                          onChange={(e) => {
                            const next = [...services];
                            next[idx] = { ...srv, active: e.target.checked };
                            setServices(next);
                          }}
                          className="w-4 h-4 accent-[#0A0A0C]"
                        />
                        On
                      </label>
                    </div>

                    <div className="md:col-span-12 pt-2 border-t border-neutral-100">
                      <div className="text-[11px] font-medium text-neutral-500 mb-1.5">
                        Required Supporting Documents for this Service ({(srv.requiredDocuments || []).length} selected)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STANDARD_DOCUMENT_NAMES.map((docName) => {
                          const selected = (srv.requiredDocuments || []).includes(docName);
                          return (
                            <label
                              key={docName}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                                selected
                                  ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                                  : 'bg-[#F6F6F7] text-neutral-700 border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const current = srv.requiredDocuments || [];
                                  const nextDocs = e.target.checked
                                    ? current.includes(docName)
                                      ? current
                                      : [...current, docName]
                                    : current.filter((d) => d !== docName);
                                  const next = [...services];
                                  next[idx] = { ...srv, requiredDocuments: nextDocs };
                                  setServices(next);
                                }}
                                className="sr-only"
                              />
                              <span>{docName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Service */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div className="text-xs font-bold text-[#8A5A00] uppercase">
                Add New Service to Category Box
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <select
                    value={newSrvCat}
                    onChange={(e) => setNewSrvCat(e.target.value as ServiceCategoryKey)}
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    placeholder="Service Name (English)"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newSrvNameHi}
                    onChange={(e) => setNewSrvNameHi(e.target.value)}
                    placeholder="Hindi Title (optional)"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={newSrvOrigFee}
                    onChange={(e) => setNewSrvOrigFee(Number(e.target.value) || 0)}
                    placeholder="Original Fee"
                    className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#0A0A0C] bg-[#FEF7E6] border border-[#D49B28] hover:bg-[#E5A93B] rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Service
                  </button>
                </div>
                <div className="sm:col-span-12 space-y-1.5">
                  <div className="text-[11px] font-medium text-neutral-500">
                    Select Required Supporting Documents for New Service
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_DOCUMENT_NAMES.map((docName) => {
                      const selected = newSrvDocs.includes(docName);
                      return (
                        <label
                          key={docName}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                            selected
                              ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                              : 'bg-[#F6F6F7] text-neutral-700 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              setNewSrvDocs((prev) =>
                                e.target.checked
                                  ? prev.includes(docName)
                                    ? prev
                                    : [...prev, docName]
                                  : prev.filter((d) => d !== docName)
                              );
                            }}
                            className="sr-only"
                          />
                          <span>{docName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={busyAction}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {busyAction ? 'Saving...' : 'Save Settings & Fees'}
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};

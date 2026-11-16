import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck2,
  Fingerprint,
  Globe,
  GraduationCap,
  HeartPulse,
  IdCard,
  Landmark,
  Menu,
  MessageCircle,
  Phone,
  Plane,
  QrCode,
  ReceiptText,
  Search,
  ShieldCheck,
  Sprout,
  TrainFront,
  User,
  X,
} from 'lucide-react';
import type {
  BootstrapResponse,
  CustomerAccount,
  ServiceCategoryKey,
  ServicePackage,
  ServiceRequest,
} from './types';
import { STANDARD_SUPPORTING_DOCUMENTS } from './constants/documents';
import { computePlatformCharge, formatCurrency } from './utils/whatsapp';
import {
  CATEGORY_TRANSLATIONS,
  getLocalizedDocName,
  getLocalizedService,
  LANGUAGE_OPTIONS,
  TOP_TEN_SHORT_LABELS,
  UI_STRINGS,
  WHATSAPP_SUPPORT_DISPLAY,
  WHATSAPP_SUPPORT_URL,
  type AppLanguage,
} from './i18n/translations';
import { ServiceWizard, type PortalWindowNumber } from './components/ServiceWizard';
import { TrackSlipView } from './components/TrackSlipView';
import { OwnerDeskView } from './components/OwnerDeskView';
import { AuthProfileModal } from './components/AuthProfileModal';

type ViewMode = 'portal' | 'owner';

const LOGO_URL = '/src/assets/images/mr_ashraf_logo_1794751667761.jpg';
const HERO_DESK_URL = '/src/assets/images/hero_service_desk_1794751292613.jpg';
const SLIP_PHOTO_URL = '/src/assets/images/physical_processing_slip_1794751292493.jpg';

const WINDOW_ANCHOR: Record<PortalWindowNumber, string> = {
  1: 'window-service-type',
  2: 'window-personal-details',
  3: 'window-payment-gateway',
  4: 'window-slip-tracking',
};

const CATEGORY_META: {
  key: ServiceCategoryKey;
  index: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'identity_certificates', index: '01', icon: ShieldCheck },
  { key: 'banking_finance', index: '02', icon: Landmark },
  { key: 'govt_schemes', index: '03', icon: Building2 },
  { key: 'education_jobs', index: '04', icon: GraduationCap },
  { key: 'business_travel', index: '05', icon: Plane },
];

const TOP_TEN_SERVICES_META: {
  serviceId: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'black' | 'gold' | 'ivory';
}[] = [
  { serviceId: 'srv-aadhaar', icon: Fingerprint, tone: 'black' },
  { serviceId: 'srv-pan', icon: CreditCard, tone: 'gold' },
  { serviceId: 'srv-voter-id', icon: BadgeCheck, tone: 'ivory' },
  { serviceId: 'srv-certificates', icon: FileCheck2, tone: 'black' },
  { serviceId: 'srv-eshram-ration', icon: IdCard, tone: 'gold' },
  { serviceId: 'srv-aeps-banking', icon: Landmark, tone: 'ivory' },
  { serviceId: 'srv-pm-kisan', icon: Sprout, tone: 'black' },
  { serviceId: 'srv-ayushman-bharat', icon: HeartPulse, tone: 'gold' },
  { serviceId: 'srv-govt-job', icon: Briefcase, tone: 'ivory' },
  { serviceId: 'srv-irctc-flight', icon: TrainFront, tone: 'black' },
];

export default function App() {
  const [lang, setLang] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('ashraf_lang');
      if (saved === 'en' || saved === 'hi' || saved === 'bn') return saved;
    } catch {
      // Ignore storage access restrictions
    }
    return 'en';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pathLower = window.location.pathname.toLowerCase();
      if (pathLower === '/admin' || pathLower.startsWith('/admin/') || params.get('admin') === '1') {
        return 'owner';
      }
    }
    return 'portal';
  });

  const [activeWindow, setActiveWindow] = useState<PortalWindowNumber>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('track')) return 4;
    }
    return 1;
  });

  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [wizardProgress, setWizardProgress] = useState({
    personalDone: false,
    serviceFormDone: false,
    paymentSubmitted: false,
  });

  const [trackLookupRef, setTrackLookupRef] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('track') || '';
    }
    return '';
  });
  const [recentRequestNumbers, setRecentRequestNumbers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ashraf_recent_requests');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [activeCategoryBox, setActiveCategoryBox] = useState<ServiceCategoryKey | 'all'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [slipImgFailed, setSlipImgFailed] = useState(false);
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const [copiedDashboardUpi, setCopiedDashboardUpi] = useState(false);

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ashraf_customer_token');
    } catch {
      return null;
    }
  });
  const [customerUser, setCustomerUser] = useState<CustomerAccount | null>(null);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'profile'>('signin');

  const suppressSpyUntilRef = useRef<number>(0);

  const t = UI_STRINGS[lang];

  const handleChangeLanguage = (nextLang: AppLanguage) => {
    setLang(nextLang);
    try {
      localStorage.setItem('ashraf_lang', nextLang);
    } catch {
      // Ignore storage access restrictions
    }
  };

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Failed to load portal data.');
      const data = (await res.json()) as BootstrapResponse;
      setBootstrap(data);
      setSelectedServiceId((prev) => prev || data.services[0]?.id || '');
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to reach service desk server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const fetchCustomerSession = useCallback(async (tok: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        setCustomerUser(null);
        setMyRequests([]);
        setCustomerToken(null);
        try {
          localStorage.removeItem('ashraf_customer_token');
        } catch {
          // Ignore storage restrictions
        }
        return;
      }
      const data = await res.json();
      setCustomerUser(data.user || null);
      setMyRequests(data.myRequests || []);
    } catch {
      // Ignore network blip
    }
  }, []);

  useEffect(() => {
    if (customerToken) {
      fetchCustomerSession(customerToken);
    }
  }, [customerToken, fetchCustomerSession]);

  const openAuthModal = useCallback(
    (tab: 'signin' | 'signup' | 'profile' = customerUser ? 'profile' : 'signin') => {
      setAuthModalTab(customerUser ? 'profile' : tab);
      setAuthModalOpen(true);
      setMobileMenuOpen(false);
    },
    [customerUser]
  );

  const handleAuthSuccess = (payload: {
    token: string;
    user: CustomerAccount;
    myRequests: ServiceRequest[];
  }) => {
    setCustomerToken(payload.token);
    setCustomerUser(payload.user);
    setMyRequests(payload.myRequests);
    try {
      localStorage.setItem('ashraf_customer_token', payload.token);
    } catch {
      // Ignore storage restrictions
    }
  };

  const handleSignOut = () => {
    setCustomerToken(null);
    setCustomerUser(null);
    setMyRequests([]);
    try {
      localStorage.removeItem('ashraf_customer_token');
    } catch {
      // Ignore storage restrictions
    }
  };

  const syncUrlForMode = (mode: ViewMode) => {
    if (typeof window === 'undefined') return;
    try {
      const targetUrl = mode === 'owner' ? '/admin' : '/';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    } catch {
      // Ignore history restrictions
    }
  };

  const jumpToWindow = useCallback(
    (win: PortalWindowNumber, customElementId?: string) => {
      suppressSpyUntilRef.current = Date.now() + 750;
      setViewMode('portal');
      syncUrlForMode('portal');
      setActiveWindow(win);
      setMobileMenuOpen(false);
      const targetId = customElementId || WINDOW_ANCHOR[win];
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });
    },
    []
  );

  // If loaded with ?track=..., scroll smoothly to Window 04 once data arrives
  useEffect(() => {
    if (!loading && bootstrap && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('track')) {
        jumpToWindow(4);
      }
    }
  }, [loading, bootstrap, jumpToWindow]);

  useEffect(() => {
    const handlePopState = () => {
      const pathLower = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (pathLower === '/admin' || pathLower.startsWith('/admin/') || params.get('admin') === '1') {
        setViewMode('owner');
      } else if (params.get('track')) {
        setTrackLookupRef(params.get('track') || '');
        jumpToWindow(4);
      } else {
        setViewMode('portal');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [jumpToWindow]);

  // Live Scroll-Spy across the 4 Transition Windows
  useEffect(() => {
    if (viewMode !== 'portal' || loading || !bootstrap) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observedIds: { id: string; win: PortalWindowNumber }[] = [
      { id: 'window-service-type', win: 1 },
      { id: 'window-personal-details', win: 2 },
      { id: 'window-payment-gateway', win: 3 },
      { id: 'window-slip-tracking', win: 4 },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < suppressSpyUntilRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const match = observedIds.find((o) => o.id === visible[0].target.id);
          if (match) {
            setActiveWindow(match.win);
          }
        }
      },
      {
        rootMargin: '-22% 0px -58% 0px',
        threshold: [0.05, 0.25, 0.5],
      }
    );

    observedIds.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [viewMode, loading, bootstrap]);

  const handleSelectAndAdvance = (srv?: ServicePackage) => {
    if (srv) {
      setSelectedServiceId(srv.id);
    }
    jumpToWindow(2, 'window-personal-details');
  };

  const handleRequestCreated = (req: ServiceRequest) => {
    setRecentRequestNumbers((prev) => {
      const updated = [req.requestNumber, ...prev.filter((n) => n !== req.requestNumber)].slice(
        0,
        5
      );
      try {
        localStorage.setItem('ashraf_recent_requests', JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    });
    fetchBootstrap();
    if (customerToken) {
      fetchCustomerSession(customerToken);
    }
  };

  const handleNavigateTrack = (reqNum: string) => {
    setTrackLookupRef(reqNum);
    jumpToWindow(4, 'window-slip-tracking');
  };

  const openAdminPlatform = () => {
    setViewMode('owner');
    syncUrlForMode('owner');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const settings = bootstrap?.settings;
  const services = bootstrap?.services || [];
  const platformPercent = settings?.platformChargePercent ?? 20;

  const activeServiceObj = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );

  const visibleCategories = useMemo(() => {
    return activeCategoryBox === 'all'
      ? CATEGORY_META
      : CATEGORY_META.filter((c) => c.key === activeCategoryBox);
  }, [activeCategoryBox]);

  const normalizedSearch = catalogSearch.trim().toLowerCase();

  const matchesSearch = useCallback(
    (srv: ServicePackage) => {
      if (!normalizedSearch) return true;
      const loc = getLocalizedService(srv, lang);
      return (
        srv.name.toLowerCase().includes(normalizedSearch) ||
        srv.nameHi.toLowerCase().includes(normalizedSearch) ||
        srv.description.toLowerCase().includes(normalizedSearch) ||
        loc.name.toLowerCase().includes(normalizedSearch) ||
        loc.description.toLowerCase().includes(normalizedSearch)
      );
    },
    [normalizedSearch, lang]
  );

  const totalMatchingCount = useMemo(
    () =>
      visibleCategories.reduce(
        (sum, cat) =>
          sum + services.filter((s) => s.categoryKey === cat.key && matchesSearch(s)).length,
        0
      ),
    [visibleCategories, services, matchesSearch]
  );

  const scrollingStages: {
    win: PortalWindowNumber;
    num: string;
    label: string;
    done: boolean;
  }[] = [
    { win: 1, num: '01', label: t.scrolling.stage1Label, done: Boolean(activeServiceObj) },
    {
      win: 2,
      num: '02',
      label: t.scrolling.stage2Label,
      done: wizardProgress.personalDone && wizardProgress.serviceFormDone,
    },
    {
      win: 3,
      num: '03',
      label: t.scrolling.stage3Label,
      done: wizardProgress.paymentSubmitted,
    },
    {
      win: 4,
      num: '04',
      label: t.scrolling.stage4Label,
      done: wizardProgress.paymentSubmitted,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F7] text-[#0A0A0C]">
      {/* Top Bar Contract: 3 zones separated by gap-8 (56px mobile / 64px desktop) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Emblem + Single-line Wordmark */}
          <button
            type="button"
            onClick={() => jumpToWindow(1)}
            className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
          >
            {!logoImgFailed ? (
              <img
                src={LOGO_URL}
                alt="Mr Ashraf Banking Traveling Communication Logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoImgFailed(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-[#D49B28] shrink-0"
              />
            ) : (
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0A0A0C] text-[#E5A93B] font-display font-bold text-sm flex items-center justify-center shrink-0">
                MA
              </span>
            )}
            <span className="font-display text-sm sm:text-base font-bold tracking-tight text-[#0A0A0C] whitespace-nowrap truncate max-w-[190px] sm:max-w-[300px]">
              {settings?.businessName || 'Mr Ashraf Banking Traveling Communication'}
            </span>
          </button>

          {/* Zone 2: 5 concise single-line scrolling/view links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-neutral-600">
            <button
              type="button"
              onClick={() => jumpToWindow(1)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                viewMode === 'portal' && activeWindow === 1
                  ? 'text-[#0A0A0C] font-semibold border-[#D49B28]'
                  : 'border-transparent hover:text-[#0A0A0C]'
              }`}
            >
              {t.nav.services}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(2)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                viewMode === 'portal' && activeWindow === 2
                  ? 'text-[#0A0A0C] font-semibold border-[#D49B28]'
                  : 'border-transparent hover:text-[#0A0A0C]'
              }`}
            >
              {t.nav.fillDetails}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(3)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                viewMode === 'portal' && activeWindow === 3
                  ? 'text-[#0A0A0C] font-semibold border-[#D49B28]'
                  : 'border-transparent hover:text-[#0A0A0C]'
              }`}
            >
              {t.nav.paymentGateway}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(4)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                viewMode === 'portal' && activeWindow === 4
                  ? 'text-[#0A0A0C] font-semibold border-[#D49B28]'
                  : 'border-transparent hover:text-[#0A0A0C]'
              }`}
            >
              {t.nav.trackSlip}
            </button>
            <button
              type="button"
              onClick={openAdminPlatform}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                viewMode === 'owner'
                  ? 'text-[#0A0A0C] font-semibold border-[#D49B28]'
                  : 'border-transparent hover:text-[#0A0A0C]'
              }`}
            >
              {t.nav.adminPlatform}
            </button>
          </nav>

          {/* Zone 3: 1 primary action + mobile menu toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                viewMode === 'owner' ? jumpToWindow(1) : handleSelectAndAdvance(activeServiceObj)
              }
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {viewMode === 'owner' ? t.nav.backToPortal : t.nav.startRequest}
            </button>

            <button
              type="button"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 text-[#0A0A0C] hover:bg-neutral-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1">
            <button
              type="button"
              onClick={() => jumpToWindow(1)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
                viewMode === 'portal' && activeWindow === 1
                  ? 'bg-[#0A0A0C] text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              01. {t.nav.services}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(2)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
                viewMode === 'portal' && activeWindow === 2
                  ? 'bg-[#0A0A0C] text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              02. {t.nav.fillDetails}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(3)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
                viewMode === 'portal' && activeWindow === 3
                  ? 'bg-[#0A0A0C] text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              03. {t.nav.paymentGateway}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(4)}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
                viewMode === 'portal' && activeWindow === 4
                  ? 'bg-[#0A0A0C] text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              04. {t.nav.trackSlip}
            </button>
            <button
              type="button"
              onClick={() => openAuthModal(customerUser ? 'profile' : 'signin')}
              className="w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg text-[#0A0A0C] bg-[#FEF7E6] border border-[#E8CE96] cursor-pointer"
            >
              {customerUser ? `${t.auth.myProfileBtn}: ${customerUser.fullName}` : t.auth.loginRegisterBtn}
            </button>
            <button
              type="button"
              onClick={openAdminPlatform}
              className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer ${
                viewMode === 'owner'
                  ? 'bg-[#0A0A0C] text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {t.nav.adminPlatform}
            </button>
          </div>
        )}
      </header>

      {/* Compact Sticky Next-to-Next Stage Transition Rail (Scrolling Mode Only, ~38px height) */}
      {viewMode === 'portal' && !loading && !loadError && (
        <div className="no-print sticky top-14 sm:top-16 z-20 bg-[#0A0A0C] border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-10 flex items-center gap-2 overflow-x-auto">
            {scrollingStages.map((stage, idx) => {
              const isCurrent = activeWindow === stage.win;
              return (
                <React.Fragment key={stage.win}>
                  <button
                    type="button"
                    onClick={() => jumpToWindow(stage.win)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#E5A93B] text-[#0A0A0C]'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span className="font-mono font-bold">{stage.num}.</span>
                    <span>{stage.label}</span>
                    {stage.done && !isCurrent && (
                      <Check className="w-3 h-3 text-[#E5A93B] shrink-0" />
                    )}
                  </button>
                  {idx < scrollingStages.length - 1 && (
                    <ArrowRight
                      className="w-3 h-3 text-neutral-600 shrink-0 hidden sm:inline"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp Support Bar (+91 9520951867) & 3-Language Switcher (English | हिन्दी | বাংলা) */}
      <div className="no-print bg-[#121216] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#F0B949]">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t.supportBar.label}:</span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-white">
              {WHATSAPP_SUPPORT_DISPLAY}
            </span>
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t.supportBar.chatBtn}
            </a>
            <a
              href="tel:+919520951867"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-200 border border-neutral-700 hover:border-[#E5A93B] hover:text-white rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Phone className="w-3 h-3" />
              {t.supportBar.callBtn}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAuthModal(customerUser ? 'profile' : 'signin')}
              className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-white text-[#0A0A0C] border-white hover:bg-[#FEF7E6]"
            >
              {customerUser?.photoUrl ? (
                <img
                  src={customerUser.photoUrl}
                  alt={customerUser.fullName}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover border border-[#0A0A0C] shrink-0"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-[#8A5A00] shrink-0" />
              )}
              <span>
                {customerUser ? customerUser.fullName : t.auth.loginRegisterBtn}
              </span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-400">
              <Globe className="w-3.5 h-3.5" />
              {t.supportBar.languageLabel}:
            </span>
            <div
              role="group"
              aria-label="Language Switcher"
              className="inline-flex items-center gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleChangeLanguage(opt.code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    lang === opt.code
                      ? 'bg-white text-[#0A0A0C] font-semibold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {opt.nativeLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {loading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-sm text-neutral-500">
              Loading service categories and counter settings...
            </div>
          </div>
        )}

        {!loading && loadError && (
          <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-rose-900 space-y-3">
              <div className="font-semibold">Unable to connect to service desk backend</div>
              <p>{loadError}</p>
              <button
                type="button"
                onClick={fetchBootstrap}
                className="px-4 py-2 text-xs font-medium text-white bg-[#0A0A0C] rounded-lg cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {!loading && !loadError && settings && (
          <>
            {/* ============================================================== */}
            {/* CUSTOMER PORTAL — CONTINUOUS SCROLLING MODE (4 WINDOWS)        */}
            {/* ============================================================== */}
            {viewMode === 'portal' && (
              <div>
                {/* WINDOW 01: SERVICE TYPE SELECTION (HERO + TOP 10 + 5 CATEGORIES) */}
                <section id="window-service-type" className="scroll-mt-28">
                  {/* Hero Section — 3-Color Black, White & Gold Architectural Split */}
                  <div className="bg-[#0A0A0C] text-white border-b border-neutral-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                      <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
                        <div className="text-xs font-medium text-[#F0B949]">
                          {t.scrolling.window1Badge} · {t.hero.kicker}
                        </div>

                        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-white leading-[1.14] [text-wrap:balance]">
                          {t.hero.title}
                        </h1>

                        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
                          {t.hero.subtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSelectAndAdvance(activeServiceObj)}
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {t.hero.startCta}
                            <ArrowRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => jumpToWindow(4)}
                            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white border border-neutral-700 hover:border-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {t.hero.trackCta}
                          </button>
                        </div>
                      </div>

                      <div className="lg:col-span-6">
                        <div className="h-full min-h-[260px] sm:min-h-[320px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 relative">
                          {!heroImgFailed ? (
                            <>
                              <img
                                src={HERO_DESK_URL}
                                alt="Physical citizen service counter verifying documents and issuing official slip"
                                referrerPolicy="no-referrer"
                                onError={() => setHeroImgFailed(true)}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#0A0A0C] text-white">
                              <FileCheck2 className="w-10 h-10 text-[#E5A93B] mb-3" />
                              <div className="font-display font-semibold text-lg">
                                {settings.businessName}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Full-width 4-Column Interactive Process Strip */}
                    <div className="bg-white text-[#0A0A0C] border-t border-neutral-200">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {t.hero.steps.map((item, idx) => {
                          const targetWin = ((idx + 1) as PortalWindowNumber);
                          return (
                            <button
                              key={item.title}
                              type="button"
                              onClick={() => jumpToWindow(targetWin)}
                              className="text-left space-y-1 p-2.5 -m-2.5 rounded-lg hover:bg-[#FEF7E6]/60 transition-colors cursor-pointer"
                            >
                              <div className="text-sm font-bold text-[#0A0A0C]">{item.title}</div>
                              <p className="text-xs text-neutral-600 leading-relaxed">{item.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Paytm / PhonePe / Google Pay Style Top 10 Most Used Services Quick Launcher */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-2">
                    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                      {/* Top Fintech Utility Strip */}
                      <div className="px-5 sm:px-6 py-4 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <h2 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                            {t.topServices.title}
                          </h2>
                          <p className="text-xs text-neutral-300 mt-0.5">{t.topServices.subtitle}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.clipboard && settings.upiId) {
                                navigator.clipboard.writeText(settings.upiId);
                                setCopiedDashboardUpi(true);
                                setTimeout(() => setCopiedDashboardUpi(false), 2000);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-[#F0B949] bg-neutral-900 border border-neutral-700 hover:border-[#E5A93B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {copiedDashboardUpi ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t.topServices.copiedUpiAction}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{settings.upiId}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => jumpToWindow(3)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{t.topServices.scanPayAction}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => jumpToWindow(4)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-[#F0B949]" />
                            <span>{t.topServices.trackSlipAction}</span>
                          </button>
                        </div>
                      </div>

                      {/* 5x2 Quick App-Tile Grid (Paytm / PhonePe / GPay Layout) */}
                      <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                        {TOP_TEN_SERVICES_META.map((item) => {
                          const srv = services.find((s) => s.id === item.serviceId);
                          if (!srv) return null;
                          const Icon = item.icon;
                          const labelInfo = TOP_TEN_SHORT_LABELS[item.serviceId]?.[lang];
                          const totalFee =
                            srv.originalFee +
                            computePlatformCharge(srv.originalFee, platformPercent);
                          const isSelected = srv.id === activeServiceObj?.id;

                          const squircleClasses =
                            item.tone === 'black'
                              ? 'bg-[#0A0A0C] text-[#F0B949] border border-[#0A0A0C]'
                              : item.tone === 'gold'
                              ? 'bg-[#E5A93B] text-[#0A0A0C] border border-[#D49B28]'
                              : 'bg-[#FEF7E6] text-[#8A5A00] border border-[#E8CE96]';

                          return (
                            <button
                              key={item.serviceId}
                              type="button"
                              onClick={() => handleSelectAndAdvance(srv)}
                              className={`group flex flex-col items-center justify-start text-center p-3.5 sm:p-4 rounded-xl border transition-all min-h-[136px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0C] ${
                                isSelected
                                  ? 'border-[#0A0A0C] bg-[#FEF7E6] ring-1 ring-[#D49B28]'
                                  : 'border-neutral-200 bg-white hover:bg-[#FEF7E6]/50 hover:border-[#0A0A0C]'
                              }`}
                            >
                              <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-150 group-hover:-translate-y-0.5 ${squircleClasses}`}
                              >
                                <Icon className="w-6 h-6" />
                              </div>

                              <div className="mt-3 text-xs sm:text-[13px] font-bold text-[#0A0A0C] leading-snug line-clamp-2">
                                {labelInfo?.label || srv.name}
                              </div>

                              <div className="mt-0.5 text-[11px] text-neutral-500 leading-tight truncate max-w-full">
                                {labelInfo?.sub || srv.turnaroundStandard}
                              </div>

                              <div className="mt-auto pt-2 font-mono text-[11px] font-bold tabular-nums text-[#8A5A00]">
                                {formatCurrency(totalFee, settings.currencySymbol)}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer Action Strip */}
                      <div className="px-5 sm:px-6 py-3 bg-[#F6F6F7] border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-neutral-600">
                          {t.topServices.countSummary}
                        </span>
                        <a
                          href="#services-catalog"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0C] hover:text-[#8A5A00] whitespace-nowrap shrink-0"
                        >
                          <span>{t.topServices.browseAllBtn}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* All 5 Service Category Boxes — Carefully Arranged & Searchable */}
                  <div
                    id="services-catalog"
                    className="scroll-mt-32 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6 space-y-8"
                  >
                    <div className="space-y-5">
                      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div>
                          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0C] [text-wrap:balance]">
                            {t.catalog.heading}
                          </h2>
                          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
                            {t.catalog.subheading}
                          </p>
                        </div>

                        {/* Search Box for Instant Service Lookup */}
                        <div className="relative w-full lg:w-96">
                          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            placeholder={t.catalog.searchPlaceholder}
                            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                          />
                          {catalogSearch && (
                            <button
                              type="button"
                              onClick={() => setCatalogSearch('')}
                              aria-label="Clear search"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#0A0A0C] cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Interactive Category Filter Tabs */}
                      <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-neutral-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setActiveCategoryBox('all')}
                          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            activeCategoryBox === 'all'
                              ? 'bg-[#0A0A0C] text-white'
                              : 'text-neutral-600 hover:text-[#0A0A0C] hover:bg-neutral-100'
                          }`}
                        >
                          {t.catalog.allCategories} ({services.length})
                        </button>
                        {CATEGORY_META.map((cat) => {
                          const catTitle = CATEGORY_TRANSLATIONS[cat.key][lang].title;
                          const count = services.filter((s) => s.categoryKey === cat.key).length;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setActiveCategoryBox(cat.key)}
                              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                activeCategoryBox === cat.key
                                  ? 'bg-[#0A0A0C] text-white'
                                  : 'text-neutral-600 hover:text-[#0A0A0C] hover:bg-neutral-100'
                              }`}
                            >
                              {cat.index}. {catTitle} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {totalMatchingCount === 0 ? (
                      <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center space-y-3">
                        <div className="text-base font-semibold text-[#0A0A0C]">
                          {t.catalog.noMatchTitle}
                        </div>
                        <p className="text-sm text-neutral-600">{t.catalog.noMatchDesc}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSearch('');
                            setActiveCategoryBox('all');
                          }}
                          className="px-4 py-2 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg cursor-pointer"
                        >
                          {t.catalog.clearFilters}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {visibleCategories.map((cat) => {
                          const catServices = services.filter(
                            (s) => s.categoryKey === cat.key && matchesSearch(s)
                          );
                          if (catServices.length === 0) return null;
                          const Icon = cat.icon;
                          const catLoc = CATEGORY_TRANSLATIONS[cat.key][lang];
                          return (
                            <div
                              key={cat.key}
                              className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
                            >
                              {/* Bold Black Category Header Strip with Gold Index */}
                              <div className="px-6 py-4 bg-[#0A0A0C] text-white flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-lg bg-[#E5A93B] text-[#0A0A0C] flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-mono text-xs font-bold text-[#F0B949]">
                                        {cat.index}
                                      </span>
                                      <h3 className="text-base sm:text-lg font-bold text-white">
                                        {catLoc.title}
                                      </h3>
                                    </div>
                                    <p className="text-xs text-neutral-300 mt-0.5">{catLoc.subtitle}</p>
                                  </div>
                                </div>
                                <span className="font-mono text-xs text-[#F0B949] whitespace-nowrap tabular-nums">
                                  {catServices.length} {t.catalog.servicesAvailable}
                                </span>
                              </div>

                              {/* Clean 3-Column Arranged Service Cards */}
                              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {catServices.map((srv, srvIdx) => {
                                  const charge = computePlatformCharge(
                                    srv.originalFee,
                                    platformPercent
                                  );
                                  const totalStd = srv.originalFee + charge;
                                  const locSrv = getLocalizedService(srv, lang);
                                  const reqDocs = srv.requiredDocuments || [];
                                  const isSelected = srv.id === activeServiceObj?.id;
                                  return (
                                    <div
                                      key={srv.id}
                                      className={`flex flex-col justify-between p-4 border rounded-lg transition-colors ${
                                        isSelected
                                          ? 'border-[#0A0A0C] bg-[#FEF7E6]/50 ring-1 ring-[#D49B28]'
                                          : 'border-neutral-200 bg-white hover:border-[#0A0A0C]'
                                      }`}
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                                          <span className="font-mono font-semibold text-[#8A5A00]">
                                            {cat.index}.{srvIdx + 1}
                                          </span>
                                          <span className="truncate">{srv.turnaroundStandard}</span>
                                        </div>

                                        <h4 className="text-sm font-bold text-[#0A0A0C] leading-snug">
                                          {locSrv.name}
                                        </h4>

                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                          {locSrv.description}
                                        </p>

                                        {reqDocs.length > 0 && (
                                          <div className="pt-1.5 text-[11px] text-neutral-600 leading-snug">
                                            <span className="font-semibold text-[#0A0A0C]">
                                              {t.catalog.requiredLabel} ({reqDocs.length}):
                                            </span>{' '}
                                            {reqDocs.map((d) => getLocalizedDocName(d, lang)).join(', ')}
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-4 pt-3 border-t border-neutral-100 space-y-3">
                                        <div className="flex items-baseline justify-between gap-2 text-xs">
                                          <span className="text-neutral-600">
                                            {t.catalog.originalLabel}{' '}
                                            <span className="font-mono tabular-nums text-[#0A0A0C]">
                                              {formatCurrency(
                                                srv.originalFee,
                                                settings.currencySymbol
                                              )}
                                            </span>{' '}
                                            + {platformPercent}%{' '}
                                            <span className="font-mono tabular-nums text-[#0A0A0C]">
                                              ({formatCurrency(charge, settings.currencySymbol)})
                                            </span>
                                          </span>
                                          <span className="font-mono text-sm font-bold tabular-nums text-[#0A0A0C]">
                                            {formatCurrency(totalStd, settings.currencySymbol)}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleSelectAndAdvance(srv)}
                                          className={`w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                                            isSelected
                                              ? 'bg-[#E5A93B] text-[#0A0A0C] hover:bg-[#D49B28]'
                                              : 'bg-[#0A0A0C] text-white hover:bg-neutral-800'
                                          }`}
                                        >
                                          {t.catalog.applyBtn}
                                          <ArrowRight
                                            className={`w-3.5 h-3.5 ${
                                              isSelected ? 'text-[#0A0A0C]' : 'text-[#E5A93B]'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Next-to-Next Transition Bridge Banner from Window 01 -> Window 02 */}
                    {activeServiceObj && (
                      <div className="p-5 bg-[#0A0A0C] text-white rounded-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-mono font-semibold text-[#F0B949]">
                            {t.scrolling.selectedServiceBanner}{' '}
                            {CATEGORY_TRANSLATIONS[activeServiceObj.categoryKey][lang].title}
                          </div>
                          <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                            {getLocalizedService(activeServiceObj, lang).name}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => jumpToWindow(2, 'window-personal-details')}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {t.scrolling.continueToPersonalBtn}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Standardized Supporting Documents & File Upload Rules */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-neutral-100">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-[#0A0A0C]">
                            {t.catalog.docsSectionTitle}
                          </h3>
                          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                            <strong className="text-[#8A5A00]">
                              {t.catalog.docsSectionNotePrefix}
                            </strong>{' '}
                            {t.catalog.docsSectionDesc}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#0A0A0C] whitespace-nowrap">
                          JPG / JPEG / PNG / PDF
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {STANDARD_SUPPORTING_DOCUMENTS.map((doc) => (
                          <div
                            key={doc.name}
                            className="p-3 bg-[#F6F6F7] border border-neutral-200 rounded-lg space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#0A0A0C]">
                                {getLocalizedDocName(doc.name, lang)}
                              </span>
                              <span className="font-mono text-[11px] font-medium text-[#8A5A00] whitespace-nowrap">
                                {doc.maxSizeLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600 leading-snug">
                              {doc.examples}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* WINDOWS 02 & 03: PERSONAL DETAILS -> SERVICE FORM & DOCS -> PAYMENT GATEWAY */}
                <ServiceWizard
                  services={services}
                  settings={settings}
                  lang={lang}
                  selectedServiceId={activeServiceObj?.id || ''}
                  onSelectServiceId={(id) => setSelectedServiceId(id)}
                  activeWindow={activeWindow}
                  onJumpToWindow={jumpToWindow}
                  onRequestCreated={handleRequestCreated}
                  onNavigateTrack={handleNavigateTrack}
                  onProgressUpdate={setWizardProgress}
                  customerAccount={customerUser}
                  customerToken={customerToken}
                  onOpenAuth={openAuthModal}
                />

                {/* SIGNED-IN CUSTOMER QUICK APPLICATIONS & CHAT SWITCHER */}
                {customerUser && myRequests.length > 0 && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-[#0A0A0C]">
                        <User className="w-4 h-4 text-[#8A5A00]" />
                        <span>
                          {t.auth.myAppsTitle} ({myRequests.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {myRequests.slice(0, 5).map((r) => {
                          const isRej = r.status === 'rejected' || r.paymentStatus === 'rejected';
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleNavigateTrack(r.requestNumber)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                                trackLookupRef.toUpperCase() === r.requestNumber.toUpperCase()
                                  ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                                  : isRej
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400'
                                  : 'bg-[#FEF7E6] text-[#8A5A00] border-[#E8CE96] hover:border-[#0A0A0C]'
                              }`}
                            >
                              <span>{r.requestNumber}</span>
                              <span>·</span>
                              <span>{isRej ? t.auth.chatLockedPill : t.auth.chatUnlockedPill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* WINDOW 04: SLIP / TRACKING RECORD */}
                <TrackSlipView
                  settings={settings}
                  lang={lang}
                  initialQuery={trackLookupRef}
                  recentRequestNumbers={recentRequestNumbers}
                  isActiveWindow={activeWindow === 4}
                  customerToken={customerToken}
                />

                {/* Physical Processing & Official Slip Proof Section */}
                <section className="bg-white border-t border-neutral-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                    <div className="lg:col-span-5">
                      <div className="h-full min-h-[240px] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                        {!slipImgFailed ? (
                          <img
                            src={SLIP_PHOTO_URL}
                            alt="Official printed service slip with verification stamp"
                            referrerPolicy="no-referrer"
                            onError={() => setSlipImgFailed(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-neutral-500 text-sm">
                            Official Verification Slip Sample
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                      <div className="text-xs font-semibold text-[#8A5A00] uppercase tracking-wider">
                        {t.catalog.proofKicker}
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0C] [text-wrap:balance]">
                        {t.catalog.proofHeading}
                      </h2>
                      <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                        {t.catalog.proofDesc}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg">
                          <div className="font-mono text-lg font-bold tabular-nums text-[#0A0A0C]">
                            {services.length}
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {t.catalog.statActiveServices}
                          </div>
                        </div>
                        <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg">
                          <div className="font-mono text-lg font-bold tabular-nums text-[#0A0A0C]">
                            {platformPercent}%
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {t.catalog.statPlatformCharge}
                          </div>
                        </div>
                        <div className="p-3.5 bg-[#F6F6F7] border border-neutral-200 rounded-lg">
                          <div className="font-mono text-lg font-bold tabular-nums text-[#0A0A0C]">
                            {bootstrap?.stats.slipsIssued ?? 0}
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {t.catalog.statSlipsIssued}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleNavigateTrack('SRV-2026-1001')}
                          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A0A0C] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#E5A93B]" />
                          {t.catalog.sampleSlipBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ADMIN VERIFICATION & PROCESSING DESK */}
            {viewMode === 'owner' && (
              <div>
                <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 pt-6">
                  <button
                    type="button"
                    onClick={() => jumpToWindow(1)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-white border border-neutral-300 hover:border-[#0A0A0C] rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t.nav.backToPortal}
                  </button>
                </div>
                <OwnerDeskView onSettingsUpdated={fetchBootstrap} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Quiet Black, White & Gold Footer with WhatsApp Support */}
      <footer className="no-print border-t border-neutral-800 bg-[#0A0A0C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {!logoImgFailed && (
              <img
                src={LOGO_URL}
                alt={settings?.businessName || 'Mr Ashraf Banking Traveling Communication'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[#D49B28] shrink-0"
              />
            )}
            <div>
              <div className="font-display text-sm font-bold text-white">
                {settings?.businessName || 'Mr Ashraf Banking Traveling Communication'}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {settings?.officeAddress || 'Main Citizen Banking & Travel Counter'} ·{' '}
                {t.footer.helplineLabel} +{settings?.ownerWhatsapp || '918755106587'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-300">
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t.footer.whatsappSupport}: {WHATSAPP_SUPPORT_DISPLAY}
            </a>
            <button
              type="button"
              onClick={() => jumpToWindow(1)}
              className="hover:text-[#F0B949] cursor-pointer whitespace-nowrap"
            >
              {t.nav.services}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(2)}
              className="hover:text-[#F0B949] cursor-pointer whitespace-nowrap"
            >
              {t.nav.fillDetails}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(3)}
              className="hover:text-[#F0B949] cursor-pointer whitespace-nowrap"
            >
              {t.nav.paymentGateway}
            </button>
            <button
              type="button"
              onClick={() => jumpToWindow(4)}
              className="hover:text-[#F0B949] cursor-pointer whitespace-nowrap"
            >
              {t.nav.trackSlip}
            </button>
            <button
              type="button"
              onClick={openAdminPlatform}
              className="hover:text-[#F0B949] cursor-pointer whitespace-nowrap"
            >
              {t.nav.adminPlatform}
            </button>
          </div>
        </div>
      </footer>

      <AuthProfileModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        lang={lang}
        user={customerUser}
        token={customerToken}
        myRequests={myRequests}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onProfileUpdated={(updatedUser, updatedReqs) => {
          setCustomerUser(updatedUser);
          setMyRequests(updatedReqs);
        }}
        onSignOut={handleSignOut}
        onSelectRequestToTrack={handleNavigateTrack}
      />
    </div>
  );
}

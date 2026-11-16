import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  FileCheck2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import type { AuthProviderType, CustomerAccount, ServiceRequest } from '../types';
import { PROFILE_PHOTO_DOC_NAME, PROFILE_PHOTO_META } from '../constants/documents';
import { UI_STRINGS, type AppLanguage } from '../i18n/translations';
import { formatCurrency, formatDateTime, getStatusMeta } from '../utils/whatsapp';

interface AuthProfileModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'signup' | 'profile';
  lang: AppLanguage;
  user: CustomerAccount | null;
  token: string | null;
  myRequests: ServiceRequest[];
  onClose: () => void;
  onAuthSuccess: (payload: {
    token: string;
    user: CustomerAccount;
    myRequests: ServiceRequest[];
  }) => void;
  onProfileUpdated: (user: CustomerAccount, myRequests: ServiceRequest[]) => void;
  onSignOut: () => void;
  onSelectRequestToTrack: (requestNumber: string) => void;
}

const PROVIDERS: { key: AuthProviderType; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'phone', icon: Phone },
  { key: 'gmail', icon: Mail },
  { key: 'facebook', icon: UserCheck },
];

export const AuthProfileModal: React.FC<AuthProfileModalProps> = ({
  isOpen,
  initialTab = 'signin',
  lang,
  user,
  token,
  myRequests,
  onClose,
  onAuthSuccess,
  onProfileUpdated,
  onSignOut,
  onSelectRequestToTrack,
}) => {
  const t = UI_STRINGS[lang];
  const [tab, setTab] = useState<'signin' | 'signup' | 'profile'>(user ? 'profile' : initialTab);
  const [provider, setProvider] = useState<AuthProviderType>('phone');

  // Sign In fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up / Profile fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [facebookHandle, setFacebookHandle] = useState('');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [bioNotes, setBioNotes] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccessMsg(null);
    if (user) {
      setTab('profile');
      setProvider(user.authProvider);
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setFacebookHandle(user.facebookHandle || '');
      setPhotoUrl(user.photoUrl || null);
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      setGuardianName(user.guardianName || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setPostalCode(user.postalCode || '');
      setBioNotes(user.bioNotes || '');
    } else {
      setTab(initialTab === 'profile' ? 'signin' : initialTab);
    }
  }, [isOpen, user, initialTab]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExts = ['jpg', 'jpeg', 'png'];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      setError('Profile photo must be JPG, JPEG, or PNG format.');
      return;
    }
    if (file.size > PROFILE_PHOTO_META.maxSizeBytes) {
      setError(`Profile photo exceeds ${PROFILE_PHOTO_META.maxSizeLabel} limit.`);
      return;
    }

    setUploadingPhoto(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docName: PROFILE_PHOTO_DOC_NAME,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not upload profile photo.');
      }
      setPhotoUrl(data.file.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authProvider: provider,
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed.');
      }
      onAuthSuccess({
        token: data.token,
        user: data.user,
        myRequests: data.myRequests || [],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!acceptedTerms) {
      setError('You must read and accept the Required Terms & Conditions to create an account.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authProvider: provider,
          fullName,
          phone,
          email,
          facebookHandle,
          password,
          photoUrl,
          dateOfBirth,
          gender,
          guardianName,
          address,
          city,
          postalCode,
          bioNotes,
          acceptedTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      onAuthSuccess({
        token: data.token,
        user: data.user,
        myRequests: data.myRequests || [],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          facebookHandle,
          photoUrl,
          dateOfBirth,
          gender,
          guardianName,
          address,
          city,
          postalCode,
          bioNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Profile update failed.');
      }
      onProfileUpdated(data.user, data.myRequests || []);
      setSuccessMsg('Profile photo and details updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  const getProviderLabel = (key: AuthProviderType) => {
    if (key === 'gmail') return t.auth.providerGmail;
    if (key === 'facebook') return t.auth.providerFacebook;
    return t.auth.providerPhone;
  };

  const identifierLabel =
    provider === 'gmail'
      ? t.auth.identifierGmailLabel
      : provider === 'facebook'
      ? t.auth.identifierFacebookLabel
      : t.auth.identifierPhoneLabel;

  const identifierPlaceholder =
    provider === 'gmail'
      ? 'customer.name@gmail.com'
      : provider === 'facebook'
      ? 'facebook.com/username or profile email'
      : 'e.g. 919876543210';

  const modalTitle =
    tab === 'profile' && user
      ? t.auth.modalTitleProfile
      : tab === 'signup'
      ? t.auth.modalTitleSignUp
      : t.auth.modalTitleSignIn;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-neutral-300 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Black + Burnished Gold Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {photoUrl || user?.photoUrl ? (
              <img
                src={photoUrl || user?.photoUrl || ''}
                alt={user?.fullName || 'Customer Profile'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#E5A93B] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E5A93B] text-[#0A0A0C] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-mono font-semibold text-[#F0B949]">
                Mr Ashraf Banking Traveling Communication
              </div>
              <h2
                id="auth-modal-title"
                className="font-display text-base sm:text-lg font-bold text-white truncate"
              >
                {modalTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-[#F6F6F7] border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-xl">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setError(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    tab === 'signin'
                      ? 'bg-[#0A0A0C] text-[#F0B949]'
                      : 'text-neutral-600 hover:text-[#0A0A0C]'
                  }`}
                >
                  {t.auth.tabSignIn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setError(null);
                  }}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    tab === 'signup'
                      ? 'bg-[#0A0A0C] text-[#F0B949]'
                      : 'text-neutral-600 hover:text-[#0A0A0C]'
                  }`}
                >
                  {t.auth.tabSignUp}
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#0A0A0C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {t.auth.tabProfile} · {t.auth.signedInAsLabel}{' '}
                  <strong className="text-[#8A5A00]">{getProviderLabel(user.authProvider)}</strong>
                </span>
              </div>
            )}
          </div>

          {user && (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setTab('signin');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t.auth.signOutBtn}
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN TAB */}
          {!user && tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                  {t.auth.providerLabel}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {PROVIDERS.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setProvider(key)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                        provider === key
                          ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                          : 'bg-[#F6F6F7] text-neutral-700 border-neutral-200 hover:border-[#0A0A0C]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{getProviderLabel(key)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {identifierLabel} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type={provider === 'gmail' ? 'email' : 'text'}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={identifierPlaceholder}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t.auth.passwordLabel} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    required
                  />
                </div>
              </div>

              {/* Mandatory Terms Summary Reminder */}
              <div className="p-3.5 bg-[#FEF7E6] border border-[#E8CE96] rounded-xl text-xs text-[#5C3B00] space-y-1">
                <div className="font-bold text-[#0A0A0C] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#8A5A00]" />
                  {t.auth.termsHeading}
                </div>
                <p className="leading-relaxed">{t.auth.termsClauses[2]}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('signup');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-[#8A5A00] hover:text-[#0A0A0C] underline underline-offset-2 cursor-pointer"
                >
                  {t.auth.tabSignUp}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.auth.submitSignInBtn}
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP OR PROFILE EDITOR FORM */}
          {((!user && tab === 'signup') || (user && tab === 'profile')) && (
            <div className="space-y-6">
              {/* If signed in: My Applications & Chat Quick-Access Card */}
              {user && (
                <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-[#8A5A00]" />
                      {t.auth.myAppsTitle} ({myRequests.length})
                    </div>
                  </div>
                  {myRequests.length === 0 ? (
                    <p className="text-xs text-neutral-600">{t.auth.myAppsEmpty}</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {myRequests.map((req) => {
                        const isRejected =
                          req.status === 'rejected' || req.paymentStatus === 'rejected';
                        const statusMeta = getStatusMeta(req.status);
                        return (
                          <div
                            key={req.id}
                            className="p-3 bg-white border border-neutral-200 rounded-lg flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-mono font-bold text-[#8A5A00]">
                                  {req.requestNumber}
                                </span>
                                <span className="text-neutral-400">·</span>
                                <span className="font-mono text-neutral-700 tabular-nums">
                                  {formatCurrency(req.totalAmount, req.currencySymbol)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-semibold border rounded ${statusMeta.badgeClass}`}
                                >
                                  {statusMeta.label}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border rounded ${
                                    isRejected
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {isRejected ? (
                                    <Lock className="w-3 h-3" />
                                  ) : (
                                    <MessageSquare className="w-3 h-3" />
                                  )}
                                  {isRejected ? t.auth.chatLockedPill : t.auth.chatUnlockedPill}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-[#0A0A0C] mt-1 truncate">
                                {req.serviceName}
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                {formatDateTime(req.createdAt)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectRequestToTrack(req.requestNumber);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {t.auth.openInTrackChatBtn}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <form
                onSubmit={user ? handleSaveProfile : handleSignUp}
                className="space-y-5"
              >
                {!user && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#0A0A0C] uppercase tracking-wider">
                      {t.auth.providerLabel}
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {PROVIDERS.map(({ key, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setProvider(key)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                            provider === key
                              ? 'bg-[#0A0A0C] text-[#F0B949] border-[#0A0A0C]'
                              : 'bg-[#F6F6F7] text-neutral-700 border-neutral-200 hover:border-[#0A0A0C]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{getProviderLabel(key)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Photo + Core Account Inputs */}
                <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile Avatar"
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0A0A0C] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white border border-dashed border-neutral-400 flex items-center justify-center text-neutral-400 shrink-0">
                      <Camera className="w-7 h-7" />
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="text-sm font-bold text-[#0A0A0C]">
                      {t.auth.profilePhotoLabel}
                    </div>
                    <div className="text-xs font-mono text-neutral-600">
                      {t.auth.profilePhotoRule}
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] rounded-md transition-colors cursor-pointer whitespace-nowrap">
                        <Camera className="w-3.5 h-3.5" />
                        {uploadingPhoto
                          ? t.wizard.uploadingBtn
                          : photoUrl
                          ? t.auth.changePhotoBtn
                          : t.auth.uploadPhotoBtn}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            e.target.value = '';
                            void handlePhotoUpload(f);
                          }}
                        />
                      </label>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl(null)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          {t.auth.removePhotoBtn}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t.auth.fullNameLabel} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      required
                    />
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {t.auth.passwordLabel} <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        minLength={4}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t.auth.phoneOptionalLabel}{' '}
                      {provider === 'phone' && !user && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 919876543210"
                      required={provider === 'phone' && !user}
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t.auth.emailOptionalLabel}{' '}
                      {provider === 'gmail' && !user && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      required={provider === 'gmail' && !user}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>

                  <div className={user ? 'sm:col-span-2' : 'sm:col-span-2'}>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t.auth.facebookOptionalLabel}{' '}
                      {provider === 'facebook' && !user && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      type="text"
                      value={facebookHandle}
                      onChange={(e) => setFacebookHandle(e.target.value)}
                      placeholder="facebook.com/username or profile handle"
                      required={provider === 'facebook' && !user}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                    />
                  </div>
                </div>

                {/* Additional Profile Details */}
                <div className="p-4 bg-[#F6F6F7] border border-neutral-200 rounded-xl space-y-4">
                  <div className="text-xs font-bold text-[#8A5A00] uppercase tracking-wider">
                    {t.auth.additionalDetailsTitle}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.dobLabel}
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.genderLabel}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.guardianLabel}
                      </label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="Father / Guardian Name"
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.addressLabel}
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Village / House / Post Office / Street"
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.cityLabel}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="District / City"
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.pinLabel}
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 732101"
                        className="w-full px-3 py-2 text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        {t.auth.bioNotesLabel}
                      </label>
                      <input
                        type="text"
                        value={bioNotes}
                        onChange={(e) => setBioNotes(e.target.value)}
                        placeholder="Preferred language, courier note, or secondary contact..."
                        className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                      />
                    </div>
                  </div>
                </div>

                {/* Required Terms & Conditions (Sign Up) */}
                {!user && (
                  <div className="p-4 bg-[#FEF7E6] border border-[#E8CE96] rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-[#0A0A0C] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#8A5A00]" />
                        {t.auth.termsHeading}
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-[#0A0A0C] text-[#F0B949] rounded">
                        {t.auth.termsRequiredBadge}
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto p-3 bg-white border border-[#E8CE96] rounded-lg space-y-2 text-xs text-neutral-700 leading-relaxed">
                      {t.auth.termsClauses.map((clause) => (
                        <p key={clause}>{clause}</p>
                      ))}
                    </div>
                    <label className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-[#0A0A0C] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#0A0A0C] cursor-pointer"
                        required
                      />
                      <span>{t.auth.termsAcceptCheckbox}</span>
                    </label>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={busy || uploadingPhoto}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {busy
                      ? t.auth.savingBtn
                      : user
                      ? t.auth.saveProfileBtn
                      : t.auth.submitSignUpBtn}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

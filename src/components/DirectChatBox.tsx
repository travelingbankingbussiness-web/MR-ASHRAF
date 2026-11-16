import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FilePlus2,
  Lock,
  MessageSquare,
  Paperclip,
  Printer,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { RequestChatMessage, ServiceRequest, UploadedDocumentFile } from '../types';
import {
  CHAT_ATTACHMENT_DOC_NAME,
  CHAT_ATTACHMENT_META,
  EXTRA_OTHER_DOCUMENT_NAMES,
} from '../constants/documents';
import { UI_STRINGS, type AppLanguage } from '../i18n/translations';
import { formatDateTime } from '../utils/whatsapp';

interface DirectChatBoxProps {
  request: ServiceRequest;
  role: 'customer' | 'admin';
  authToken?: string | null;
  adminPasscode?: string;
  ownerName?: string;
  lang?: AppLanguage;
  onRequestUpdated?: (updated: ServiceRequest) => void;
  onGenerateAndTransferSlip?: (requestId: string) => Promise<void>;
  onPrintSlipClick?: () => void;
}

export const DirectChatBox: React.FC<DirectChatBoxProps> = ({
  request,
  role,
  authToken,
  adminPasscode,
  lang = 'en',
  onRequestUpdated,
  onGenerateAndTransferSlip,
  onPrintSlipClick,
}) => {
  const t = UI_STRINGS[lang];
  const [messages, setMessages] = useState<RequestChatMessage[]>(request.chatMessages || []);
  const [chatUnlocked, setChatUnlocked] = useState<boolean>(
    request.status !== 'rejected' && request.paymentStatus !== 'rejected'
  );
  const [messageText, setMessageText] = useState('');
  const [missedDocTarget, setMissedDocTarget] = useState<string>('');
  const [pendingAttachment, setPendingAttachment] = useState<UploadedDocumentFile | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [sending, setSending] = useState(false);
  const [issuingSlip, setIssuingSlip] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const onRequestUpdatedRef = useRef(onRequestUpdated);
  onRequestUpdatedRef.current = onRequestUpdated;

  const isRejected = request.status === 'rejected' || request.paymentStatus === 'rejected';
  const isApproved =
    !isRejected &&
    (request.paymentStatus === 'approved' ||
      request.status === 'verified' ||
      request.status === 'processing_physically' ||
      request.status === 'slip_issued');

  const docSlotOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(request.requiredDocuments || []),
          ...EXTRA_OTHER_DOCUMENT_NAMES,
        ])
      ),
    [request.requiredDocuments]
  );

  useEffect(() => {
    setMessages(request.chatMessages || []);
    setChatUnlocked(request.status !== 'rejected' && request.paymentStatus !== 'rejected');
  }, [request.id, request.status, request.paymentStatus, request.chatMessages]);

  // Initial chat fetch + Live WebSocket room subscription
  useEffect(() => {
    let active = true;
    const loadChat = async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}/chat`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setChatUnlocked(Boolean(data.chatUnlocked));
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        if (data.request) {
          onRequestUpdatedRef.current?.(data.request);
        }
      } catch {
        // Ignore transient network errors
      }
    };
    loadChat();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        if (!active) return;
        setWsConnected(true);
        ws?.send(JSON.stringify({ type: 'subscribe', requestId: request.id }));
      };
      ws.onclose = () => {
        if (active) setWsConnected(false);
      };
      ws.onerror = () => {
        if (active) setWsConnected(false);
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data || '{}'));
          if (payload.requestId !== request.id) return;
          if (payload.type === 'chat:message' && payload.message) {
            setMessages((prev) =>
              prev.some((m) => m.id === payload.message.id)
                ? prev
                : [...prev, payload.message as RequestChatMessage]
            );
            if (typeof payload.chatUnlocked === 'boolean') {
              setChatUnlocked(payload.chatUnlocked);
            }
            if (payload.request) {
              onRequestUpdatedRef.current?.(payload.request);
            }
          } else if (payload.type === 'request:updated' && payload.request) {
            if (typeof payload.chatUnlocked === 'boolean') {
              setChatUnlocked(payload.chatUnlocked);
            }
            if (Array.isArray(payload.request.chatMessages)) {
              setMessages(payload.request.chatMessages);
            }
            onRequestUpdatedRef.current?.(payload.request);
          }
        } catch {
          // Ignore malformed ws frame
        }
      };
    } catch {
      // Fallback gracefully to REST only if WebSocket fails
    }

    return () => {
      active = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'unsubscribe', requestId: request.id }));
        } catch {
          // Ignore close error
        }
      }
      ws?.close();
    };
  }, [request.id]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length]);

  const handleAttachMissedDoc = async (file: File | null) => {
    if (!file || !chatUnlocked) return;
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
      setError('Invalid file format. Only JPG, JPEG, PNG, or PDF files are allowed.');
      return;
    }
    if (file.size > CHAT_ATTACHMENT_META.maxSizeBytes) {
      setError(`File size exceeds ${CHAT_ATTACHMENT_META.maxSizeLabel} limit.`);
      return;
    }

    setUploadingDoc(true);
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
          docName: missedDocTarget || CHAT_ATTACHMENT_DOC_NAME,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Document upload failed.');
      }
      setPendingAttachment(data.file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload file.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatUnlocked) {
      setError(t.chat.lockedTitle);
      return;
    }
    if (!messageText.trim() && !pendingAttachment) return;

    setError(null);
    setSending(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (role === 'admin' && adminPasscode) {
        headers['x-owner-passcode'] = adminPasscode;
      } else if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/requests/${request.id}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: messageText.trim(),
          attachment: pendingAttachment,
          missedDocTargetName: missedDocTarget || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send message.');
      }
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
      if (data.request) {
        onRequestUpdatedRef.current?.(data.request);
      }
      setMessageText('');
      setPendingAttachment(null);
      setMissedDocTarget('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message failed.');
    } finally {
      setSending(false);
    }
  };

  const handleAllDoneTransferSlip = async () => {
    if (!onGenerateAndTransferSlip || !chatUnlocked) return;
    setIssuingSlip(true);
    setError(null);
    try {
      await onGenerateAndTransferSlip(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate & transfer slip.');
    } finally {
      setIssuingSlip(false);
    }
  };

  return (
    <div className="no-print border-2 border-[#0A0A0C] rounded-xl overflow-hidden bg-white">
      {/* Black & Burnished Gold Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-[#0A0A0C] text-white border-b-2 border-[#D49B28] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {chatUnlocked ? (
            <MessageSquare className="w-4 h-4 text-[#E5A93B] shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {t.chat.boxTitle}
            </div>
            <div className="text-[11px] font-mono text-neutral-300">
              {request.requestNumber} · {request.customerName}
              {wsConnected ? ` · ${t.chat.liveBadge}` : ''}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md border whitespace-nowrap shrink-0 ${
            !chatUnlocked
              ? 'bg-rose-950/90 text-rose-200 border-rose-700'
              : isApproved
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
              : 'bg-[#2C2208] text-[#F0B949] border-[#D49B28]'
          }`}
        >
          {!chatUnlocked ? (
            <>
              <XCircle className="w-3.5 h-3.5" />
              {t.chat.lockedRejectedBadge}
            </>
          ) : isApproved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.chat.unlockedApprovedBadge}
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              {t.chat.unlockedPendingBadge}
            </>
          )}
        </span>
      </div>

      {/* STRICT LOCKED STATE WHEN REJECTED */}
      {!chatUnlocked ? (
        <div className="p-6 bg-rose-50/70 flex flex-col items-center text-center space-y-2.5">
          <div className="w-11 h-11 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-rose-950">{t.chat.lockedTitle}</div>
          <p className="text-xs text-rose-800 max-w-lg leading-relaxed">{t.chat.lockedDesc}</p>
        </div>
      ) : (
        /* UNLOCKED REAL-TIME CHAT BOX (APPROVED OR PENDING) */
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-[#FEF7E6] border border-[#E8CE96] rounded-lg">
            <p className="text-xs text-[#5C3B00] leading-relaxed flex-1 min-w-[220px]">
              {t.chat.unlockedSub}
            </p>
            {role === 'admin' && onGenerateAndTransferSlip && (
              <button
                type="button"
                disabled={issuingSlip}
                onClick={handleAllDoneTransferSlip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={t.chat.adminAllDoneSub}
              >
                <ShieldCheck className="w-4 h-4" />
                {t.chat.adminAllDoneBtn}
              </button>
            )}
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Message Timeline */}
          <div className="bg-[#F6F6F7] border border-neutral-200 rounded-xl p-3.5 max-h-80 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                {t.chat.emptyChatText}
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderRole === role;
                const isSlipCard = msg.messageType === 'slip_transfer' && msg.slipSnapshot;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[78%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm space-y-2 border ${
                        isSlipCard
                          ? 'bg-[#FEF7E6] border-2 border-[#D49B28] text-[#0A0A0C]'
                          : isOwn
                          ? 'bg-[#0A0A0C] text-white border-[#0A0A0C]'
                          : 'bg-white text-[#0A0A0C] border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span
                          className={`font-semibold ${
                            isSlipCard
                              ? 'text-[#8A5A00]'
                              : isOwn
                              ? 'text-[#F0B949]'
                              : 'text-[#8A5A00]'
                          }`}
                        >
                          {msg.senderName}
                        </span>
                        <span
                          className={`font-mono ${
                            isOwn && !isSlipCard ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>

                      {msg.missedDocTargetName && (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded ${
                            isOwn && !isSlipCard
                              ? 'bg-neutral-800 text-[#F0B949]'
                              : 'bg-[#FEF7E6] text-[#8A5A00] border border-[#E8CE96]'
                          }`}
                        >
                          <FilePlus2 className="w-3 h-3" />
                          {msg.missedDocTargetName}
                        </div>
                      )}

                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                      {msg.attachment && (
                        <div
                          className={`p-2 rounded-lg border flex items-center gap-2.5 ${
                            isOwn && !isSlipCard
                              ? 'bg-neutral-900 border-neutral-700'
                              : 'bg-[#F6F6F7] border-neutral-200'
                          }`}
                        >
                          {msg.attachment.mimeType?.startsWith('image/') ? (
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.originalName}
                              className="w-11 h-11 rounded object-cover border border-neutral-300 bg-white shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded bg-white border border-neutral-300 flex items-center justify-center font-mono text-[10px] font-bold text-rose-700 shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">
                              {msg.attachment.originalName}
                            </div>
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 mt-0.5 ${
                                isOwn && !isSlipCard ? 'text-[#F0B949]' : 'text-[#8A5A00]'
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {t.wizard.viewBtn}
                            </a>
                          </div>
                        </div>
                      )}

                      {isSlipCard && msg.slipSnapshot && (
                        <div className="p-3 bg-white border border-[#D49B28] rounded-lg space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <ShieldCheck className="w-4 h-4" />
                            {t.chat.slipTransferredTitle}
                          </div>
                          <div className="text-xs font-mono text-[#0A0A0C]">
                            {t.chat.slipNumberLabel}:{' '}
                            <strong>{msg.slipSnapshot.slipNumber}</strong> ·{' '}
                            {msg.slipSnapshot.verificationCode}
                          </div>
                          <button
                            type="button"
                            onClick={() => (onPrintSlipClick ? onPrintSlipClick() : window.print())}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F0B949] bg-[#0A0A0C] hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {t.chat.viewPrintSlipBtn}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Composer + Missed Document Uploader */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            {/* Missed Document Slot Selector & Upload Trigger */}
            <div className="p-3 bg-[#F6F6F7] border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-[11px] font-bold text-[#0A0A0C] uppercase tracking-wider">
                  {t.chat.missedDocTitle}
                </div>
                <select
                  value={missedDocTarget}
                  onChange={(e) => setMissedDocTarget(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
                >
                  <option value="">{t.chat.missedDocGeneralOption}</option>
                  {docSlotOptions.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>

              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0A0A0C] bg-white border border-neutral-300 hover:border-[#0A0A0C] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0">
                <Paperclip className="w-3.5 h-3.5 text-[#8A5A00]" />
                {uploadingDoc ? t.chat.uploadingDocBtn : t.chat.attachDocBtn}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  className="hidden"
                  disabled={uploadingDoc}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    e.target.value = '';
                    void handleAttachMissedDoc(f);
                  }}
                />
              </label>
            </div>

            {pendingAttachment && (
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-emerald-900 truncate">
                  {pendingAttachment.originalName} ({Math.max(1, Math.ceil(pendingAttachment.sizeBytes / 1024))} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  className="text-rose-700 font-semibold hover:underline cursor-pointer shrink-0"
                >
                  {t.wizard.removeBtn}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t.chat.messagePlaceholder}
                className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0C]"
              />
              <button
                type="submit"
                disabled={sending || uploadingDoc || (!messageText.trim() && !pendingAttachment)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#0A0A0C] bg-[#E5A93B] hover:bg-[#D49B28] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {sending ? t.chat.sendingBtn : t.chat.sendBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export type RequestStatus =
  | 'payment_submitted'
  | 'verified'
  | 'processing_physically'
  | 'slip_issued'
  | 'rejected';

export type PaymentDecision = 'pending' | 'approved' | 'rejected';

export type DocumentStatus = 'pending' | 'verified' | 'missing';

export type ProcessingSpeed = 'standard' | 'express';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'card';

export type ServiceCategoryKey =
  | 'identity_certificates'
  | 'banking_finance'
  | 'govt_schemes'
  | 'education_jobs'
  | 'business_travel';

export interface ServiceFieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'date' | 'number' | 'select';
  options?: string[];
  required?: boolean;
}

export interface ServicePackage {
  id: string;
  categoryKey: ServiceCategoryKey;
  categoryTitle: string;
  categoryTitleHi: string;
  name: string;
  nameHi: string;
  description: string;
  originalFee: number;
  expressAddonFee: number;
  turnaroundStandard: string;
  turnaroundExpress: string;
  requiredHints: string[];
  requiredDocuments: string[];
  customFields: ServiceFieldDef[];
  active: boolean;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  ownerWhatsapp: string;
  supportEmail: string;
  officeAddress: string;
  currencySymbol: string;
  platformChargePercent: number;
  upiId: string;
  upiPayeeName: string;
  bankDetails: string;
  ownerPasscode: string;
}

export interface VerificationChecklist {
  detailsVerified: boolean;
  specsVerified: boolean;
  paymentVerified: boolean;
  verificationNotes: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface PhysicalProcessingInfo {
  handlerName: string;
  deskCounter: string;
  expectedCompletion: string;
  processingNotes: string;
  startedAt: string | null;
}

export interface OfficialSlip {
  slipNumber: string;
  issuedAt: string;
  verificationCode: string;
  finalRemarks: string;
  issuedBy: string;
}

export interface UploadedDocumentFile {
  docName: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

export type AuthProviderType = 'phone' | 'gmail' | 'facebook';

export interface CustomerAccount {
  id: string;
  authProvider: AuthProviderType;
  fullName: string;
  phone: string;
  email: string;
  facebookHandle: string;
  photoUrl: string | null;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  address: string;
  city: string;
  postalCode: string;
  bioNotes: string;
  acceptedTerms: boolean;
  acceptedTermsAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatMessageType = 'message' | 'missed_document' | 'slip_transfer' | 'status_note';

export interface RequestChatMessage {
  id: string;
  requestId: string;
  requestNumber: string;
  senderRole: 'customer' | 'admin';
  senderName: string;
  senderPhotoUrl?: string | null;
  messageType: ChatMessageType;
  text: string;
  attachment?: UploadedDocumentFile | null;
  missedDocTargetName?: string;
  slipSnapshot?: OfficialSlip | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  customerUserId?: string | null;

  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  processingSpeed: ProcessingSpeed;

  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;

  subjectTitle: string;
  quantity: number;
  preferredDate: string;
  referenceCode: string;
  detailedInstructions: string;
  customDetails: Record<string, string>;

  requiredDocuments: string[];
  customerConfirmedDocuments: string[];
  uploadedDocuments: Record<string, UploadedDocumentFile>;
  documentsChecklist: Record<string, DocumentStatus>;
  documentsReviewNote: string;

  originalFee: number;
  platformCharge: number;
  platformChargePercent: number;
  expressFee: number;
  totalAmount: number;
  currencySymbol: string;

  paymentMethod: PaymentMethod;
  paymentReference: string;
  payerName: string;
  paymentScreenshot?: UploadedDocumentFile | null;
  paymentCompletedAt: string;
  paymentStatus: PaymentDecision;
  paymentReviewNote: string;
  paymentReviewedAt: string | null;

  verification: VerificationChecklist;
  physicalProcessing: PhysicalProcessingInfo;
  slip: OfficialSlip | null;
  chatMessages?: RequestChatMessage[];
}

export interface BootstrapResponse {
  settings: Omit<BusinessSettings, 'ownerPasscode'>;
  services: ServicePackage[];
  stats: {
    totalRequests: number;
    slipsIssued: number;
    activeProcessing: number;
  };
}

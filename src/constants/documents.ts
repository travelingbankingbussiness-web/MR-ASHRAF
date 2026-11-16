export interface StandardDocumentMeta {
  name: string;
  category: 'supporting' | 'photo' | 'signature';
  acceptedFormatsLabel: string;
  maxSizeBytes: number;
  maxSizeLabel: string;
  examples: string;
}

export const ONE_MB_BYTES = 1 * 1024 * 1024;
export const TWO_MB_BYTES = 2 * 1024 * 1024;

export const STANDARD_SUPPORTING_DOCUMENTS: StandardDocumentMeta[] = [
  {
    name: 'Proof of Identity',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Aadhaar Card, PAN Card, Voter ID, Passport, or Driving Licence',
  },
  {
    name: 'Proof of Address',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Electricity Bill, Water Bill, Bank Passbook, or Rent Agreement',
  },
  {
    name: 'Proof of Birth',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Birth Certificate, 10th Admit Card / Marksheet, or Passport',
  },
  {
    name: 'Proof of Nationality',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Indian Passport, Birth Certificate, or Domicile / Citizenship Record',
  },
  {
    name: 'Proof of Disability',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'UDID Card or Govt Hospital Disability Certificate (if applicable)',
  },
  {
    name: 'Proof of Caste',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'SC / ST / OBC / EWS Certificate issued by Competent Authority',
  },
  {
    name: 'Proof of Income',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Tehsil Income Certificate, Salary Slip, Form 16, or ITR',
  },
  {
    name: 'Proof of Residence',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Domicile / Residence Certificate, Panchayat / Ward Certificate',
  },
  {
    name: 'Proof of National Card',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Aadhaar Card, Voter EPIC Card, Ration Card, or e-Shram UAN Card',
  },
  {
    name: 'Applicant Photo (Max 1 MB)',
    category: 'photo',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: ONE_MB_BYTES,
    maxSizeLabel: 'Max 1 MB',
    examples: 'Recent colour passport-size photograph (Size up to 1 MB)',
  },
  {
    name: 'Applicant Signature (Max 1 MB)',
    category: 'signature',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: ONE_MB_BYTES,
    maxSizeLabel: 'Max 1 MB',
    examples: 'Clear black/blue ink signature on white paper (Size up to 1 MB)',
  },
];

export const STANDARD_DOCUMENT_NAMES: string[] = STANDARD_SUPPORTING_DOCUMENTS.map(
  (d) => d.name
);

export const EXTRA_OTHER_DOCUMENTS: StandardDocumentMeta[] = [
  {
    name: 'Other Document 1 (Optional)',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Extra Document Box 1 — upload any additional supporting proof if needed',
  },
  {
    name: 'Other Document 2 (Optional)',
    category: 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: TWO_MB_BYTES,
    maxSizeLabel: 'Max 2 MB',
    examples: 'Extra Document Box 2 — upload a second optional supporting proof or annexure',
  },
];

export const EXTRA_OTHER_DOCUMENT_NAMES: string[] = EXTRA_OTHER_DOCUMENTS.map(
  (d) => d.name
);

export const PAYMENT_SCREENSHOT_DOC_NAME = 'Payment Transaction Screenshot';

export const PAYMENT_SCREENSHOT_META: StandardDocumentMeta = {
  name: PAYMENT_SCREENSHOT_DOC_NAME,
  category: 'supporting',
  acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
  maxSizeBytes: TWO_MB_BYTES,
  maxSizeLabel: 'Max 2 MB',
  examples: 'UPI / Google Pay / PhonePe / Paytm payment confirmation screenshot',
};

export const PROFILE_PHOTO_DOC_NAME = 'Profile Photo';

export const PROFILE_PHOTO_META: StandardDocumentMeta = {
  name: PROFILE_PHOTO_DOC_NAME,
  category: 'photo',
  acceptedFormatsLabel: 'JPG / JPEG / PNG',
  maxSizeBytes: ONE_MB_BYTES,
  maxSizeLabel: 'Max 1 MB',
  examples: 'Customer profile portrait photo (JPG, JPEG, PNG · Max 1 MB)',
};

export const CHAT_ATTACHMENT_DOC_NAME = 'Missed Supporting Document';

export const CHAT_ATTACHMENT_META: StandardDocumentMeta = {
  name: CHAT_ATTACHMENT_DOC_NAME,
  category: 'supporting',
  acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
  maxSizeBytes: TWO_MB_BYTES,
  maxSizeLabel: 'Max 2 MB',
  examples: 'Missed document or clarification file shared in Direct Admin Chat',
};

export function getDocumentMeta(docName: string): StandardDocumentMeta {
  const found =
    STANDARD_SUPPORTING_DOCUMENTS.find((d) => d.name === docName) ||
    EXTRA_OTHER_DOCUMENTS.find((d) => d.name === docName) ||
    (docName === PAYMENT_SCREENSHOT_DOC_NAME ? PAYMENT_SCREENSHOT_META : undefined) ||
    (docName === PROFILE_PHOTO_DOC_NAME ? PROFILE_PHOTO_META : undefined) ||
    (docName === CHAT_ATTACHMENT_DOC_NAME ? CHAT_ATTACHMENT_META : undefined);
  if (found) return found;
  const lower = docName.toLowerCase();
  const isPhotoOrSig = lower.includes('photo') || lower.includes('signature');
  return {
    name: docName,
    category: lower.includes('photo')
      ? 'photo'
      : lower.includes('signature')
      ? 'signature'
      : 'supporting',
    acceptedFormatsLabel: 'JPG / JPEG / PNG / PDF',
    maxSizeBytes: isPhotoOrSig ? ONE_MB_BYTES : TWO_MB_BYTES,
    maxSizeLabel: isPhotoOrSig ? 'Max 1 MB' : 'Max 2 MB',
    examples: 'Upload supporting document in JPG, JPEG, PNG, or PDF format',
  };
}

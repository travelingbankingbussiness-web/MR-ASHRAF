import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type {
  AuthProviderType,
  BusinessSettings,
  ChatMessageType,
  CustomerAccount,
  DocumentStatus,
  PaymentDecision,
  PaymentMethod,
  ProcessingSpeed,
  RequestChatMessage,
  ServicePackage,
  ServiceRequest,
  UploadedDocumentFile,
} from './src/types.ts';
import {
  CHAT_ATTACHMENT_DOC_NAME,
  EXTRA_OTHER_DOCUMENT_NAMES,
  PAYMENT_SCREENSHOT_DOC_NAME,
  PROFILE_PHOTO_DOC_NAME,
  getDocumentMeta,
} from './src/constants/documents.ts';

interface StoredCustomerAccount extends CustomerAccount {
  passwordHash: string;
  passwordSalt: string;
}

interface StoreData {
  schemaVersion: number;
  settings: BusinessSettings;
  services: ServicePackage[];
  requests: ServiceRequest[];
  users: StoredCustomerAccount[];
  sessionSecret: string;
  sequenceCounter: number;
  slipCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const CURRENT_SCHEMA_VERSION = 7;

const DEFAULT_SERVICES: ServicePackage[] = [
  // 1. पहचान और प्रमाण पत्र (Identity & Certificates)
  {
    id: 'srv-aadhaar',
    categoryKey: 'identity_certificates',
    categoryTitle: 'Identity & Certificates',
    categoryTitleHi: 'पहचान और प्रमाण पत्र',
    name: 'Aadhaar Card (Enrollment, Update & Mobile/Address Link)',
    nameHi: 'आधार कार्ड (नामांकन, अपडेट, और मोबाइल/पता लिंक)',
    description: 'New Aadhaar enrollment slot, demographic/address update, or mobile number linking assistance.',
    originalFee: 100,
    expressAddonFee: 50,
    turnaroundStandard: '3–5 Working Days',
    turnaroundExpress: 'Same Day Filing',
    requiredHints: ['12-Digit Aadhaar / Enrolment No.', 'Update Type', 'Mobile Number'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Birth',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Update Type',
        label: 'Aadhaar Service Type',
        placeholder: 'Select service type',
        type: 'select',
        options: ['New Enrollment', 'Address Update', 'Mobile Number Link', 'Name / DOB Correction', 'Biometric Update'],
        required: true,
      },
      {
        key: 'Aadhaar / EID Number',
        label: 'Aadhaar Number (or EID for New)',
        placeholder: 'e.g. XXXX-XXXX-4821 or New',
        type: 'text',
        required: true,
      },
      {
        key: 'Father / Husband Name',
        label: 'Father / Guardian Name',
        placeholder: 'Full guardian name as per document',
        type: 'text',
        required: true,
      },
      {
        key: 'Supporting Proof',
        label: 'Supporting Document Name',
        placeholder: 'e.g. Voter ID / Electricity Bill / Birth Certificate',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-pan',
    categoryKey: 'identity_certificates',
    categoryTitle: 'Identity & Certificates',
    categoryTitleHi: 'पहचान और प्रमाण पत्र',
    name: 'PAN Card (New Application & Correction)',
    nameHi: 'पैन कार्ड (नया आवेदन और सुधार)',
    description: 'NSDL / UTIITSL new PAN 49A filing, name/DOB correction, or lost PAN card reprint.',
    originalFee: 150,
    expressAddonFee: 60,
    turnaroundStandard: '5–7 Working Days',
    turnaroundExpress: 'Priority E-PAN Filing',
    requiredHints: ['Application Type', 'Father Name & DOB', 'Aadhaar Number'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Birth',
      'Proof of Address',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'PAN Application Type',
        label: 'Application Type',
        placeholder: 'Select type',
        type: 'select',
        options: ['New PAN Card (Form 49A)', 'PAN Correction / Update', 'Lost / Reprint PAN Card'],
        required: true,
      },
      {
        key: 'Existing PAN (if any)',
        label: 'Existing PAN Number (for Correction/Reprint)',
        placeholder: 'e.g. ABCDE1234F or N/A',
        type: 'text',
      },
      {
        key: 'Date of Birth',
        label: 'Applicant Date of Birth',
        placeholder: 'YYYY-MM-DD',
        type: 'date',
        required: true,
      },
      {
        key: 'Father Name',
        label: 'Father Full Name (for Card Print)',
        placeholder: 'First Middle Last Name',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-voter-id',
    categoryKey: 'identity_certificates',
    categoryTitle: 'Identity & Certificates',
    categoryTitleHi: 'पहचान और प्रमाण पत्र',
    name: 'Voter ID Card (New Form-6 / Correction Form-8)',
    nameHi: 'मतदाता पहचान पत्र (Voter ID - नया/सुधार)',
    description: 'New voter registration (Form 6), constituency transfer, or photo/address correction (Form 8).',
    originalFee: 100,
    expressAddonFee: 40,
    turnaroundStandard: '7–14 Working Days',
    turnaroundExpress: 'Same Day Portal Filing',
    requiredHints: ['Form Type', 'Assembly Constituency', 'EPIC Number (if correction)'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Birth',
      'Proof of Residence',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Voter Service',
        label: 'Voter ID Request Type',
        placeholder: 'Select type',
        type: 'select',
        options: ['New Voter Registration (Form 6)', 'Correction / Address Shift (Form 8)', 'EPIC Card Download & Print'],
        required: true,
      },
      {
        key: 'EPIC Number',
        label: 'Existing EPIC / Voter No. (if applicable)',
        placeholder: 'e.g. WB/12/094/112233 or New',
        type: 'text',
      },
      {
        key: 'Assembly / Booth',
        label: 'Assembly Constituency / Booth Name',
        placeholder: 'e.g. Ward 14 / Central Booth',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-certificates',
    categoryKey: 'identity_certificates',
    categoryTitle: 'Identity & Certificates',
    categoryTitleHi: 'पहचान और प्रमाण पत्र',
    name: 'Birth, Death, Income, Caste & Residence Certificate',
    nameHi: 'जन्म, मृत्यु, आय, जाति, और निवास प्रमाण पत्र',
    description: 'e-District state portal filing, physical attestation prep, and verified government certificate processing.',
    originalFee: 200,
    expressAddonFee: 80,
    turnaroundStandard: '5–10 Working Days',
    turnaroundExpress: 'Priority Desk Verification',
    requiredHints: ['Certificate Type', 'Block / Tehsil', 'Annual Income / Category'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Birth',
      'Proof of Caste',
      'Proof of Income',
      'Proof of Residence',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Certificate Type',
        label: 'Certificate Category',
        placeholder: 'Select certificate',
        type: 'select',
        options: ['Income Certificate (आय)', 'Caste Certificate (जाति)', 'Residence / Domicile (निवास)', 'Birth Certificate (जन्म)', 'Death Certificate (मृत्यु)'],
        required: true,
      },
      {
        key: 'Tehsil / Block',
        label: 'Block / Tehsil / Municipality',
        placeholder: 'Enter Block or Tehsil name',
        type: 'text',
        required: true,
      },
      {
        key: 'Parent / Spouse Name',
        label: 'Father / Mother / Spouse Name',
        placeholder: 'Full name for certificate record',
        type: 'text',
        required: true,
      },
      {
        key: 'Purpose / Income Figure',
        label: 'Purpose (or Annual Income if Income Cert)',
        placeholder: 'e.g. Scholarship / ₹96,000 per year',
        type: 'text',
      },
    ],
    active: true,
  },
  {
    id: 'srv-eshram-ration',
    categoryKey: 'identity_certificates',
    categoryTitle: 'Identity & Certificates',
    categoryTitleHi: 'पहचान और प्रमाण पत्र',
    name: 'e-Shram Card & Ration Card Services',
    nameHi: 'ई-श्रम (e-Shram) कार्ड और राशन कार्ड सेवाएं',
    description: 'Unorganized worker e-Shram UAN registration, Ration card member addition, e-KYC, or PVC card print.',
    originalFee: 100,
    expressAddonFee: 40,
    turnaroundStandard: '2–4 Working Days',
    turnaroundExpress: 'Same Day Card Print',
    requiredHints: ['Card Type', 'Family Head / Occupation', 'Bank IFSC / Ration No.'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of National Card',
      'Proof of Income',
      'Applicant Photo (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Service Option',
        label: 'Select e-Shram / Ration Service',
        placeholder: 'Select service',
        type: 'select',
        options: ['New e-Shram Card', 'e-Shram Profile Update', 'New Ration Card Filing', 'Ration Card Member Add / e-KYC'],
        required: true,
      },
      {
        key: 'Occupation / Family Members',
        label: 'Primary Occupation or Family Member Count',
        placeholder: 'e.g. Mason / 4 Family Members',
        type: 'text',
        required: true,
      },
      {
        key: 'Existing Card Number',
        label: 'Existing Ration / UAN Number (if any)',
        placeholder: 'Card number or N/A',
        type: 'text',
      },
    ],
    active: true,
  },

  // 2. बैंकिंग और वित्तीय सेवाएं (Banking & Financial Services)
  {
    id: 'srv-aeps-banking',
    categoryKey: 'banking_finance',
    categoryTitle: 'Banking & Financial Services',
    categoryTitleHi: 'बैंकिंग और वित्तीय सेवाएं',
    name: 'Bank Account Opening, AEPS Cash & Money Transfer',
    nameHi: 'बैंक खाता खोलना, नकद निकासी (AEPS), और मनी ट्रांसफर',
    description: 'CSP bank account opening, Aadhaar Enabled Payment (AEPS) settlement, and domestic money transfer.',
    originalFee: 100,
    expressAddonFee: 30,
    turnaroundStandard: 'Same Day Counter',
    turnaroundExpress: 'Immediate Desk Priority',
    requiredHints: ['Transaction / Account Type', 'Bank Name', 'Beneficiary Details'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Banking Service Type',
        label: 'Banking Operation',
        placeholder: 'Select banking service',
        type: 'select',
        options: ['New Bank Account Opening', 'AEPS Cash Withdrawal / Balance Desk', 'Domestic Money Transfer (DMT)'],
        required: true,
      },
      {
        key: 'Bank Name',
        label: 'Bank Name',
        placeholder: 'e.g. SBI / HDFC / Bank of Baroda / India Post',
        type: 'text',
        required: true,
      },
      {
        key: 'Account / Transfer Amount',
        label: 'Transfer / Deposit Amount & Last 4 Digits (if applicable)',
        placeholder: 'e.g. ₹5,000 transfer to A/C ending 4421',
        type: 'text',
      },
    ],
    active: true,
  },
  {
    id: 'srv-micro-atm',
    categoryKey: 'banking_finance',
    categoryTitle: 'Banking & Financial Services',
    categoryTitleHi: 'बैंकिंग और वित्तीय सेवाएं',
    name: 'Micro ATM Card Desk Service',
    nameHi: 'माइक्रो एटीएम (Micro ATM)',
    description: 'Debit card swipe withdrawal, mini statement receipt, and assisted Micro ATM counter settlement.',
    originalFee: 50,
    expressAddonFee: 25,
    turnaroundStandard: 'Instant Counter Slot',
    turnaroundExpress: 'Priority Home / Desk Visit',
    requiredHints: ['Bank / Card Network', 'Transaction Type', 'Amount'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of National Card',
    ],
    customFields: [
      {
        key: 'Micro ATM Request',
        label: 'Service Type',
        placeholder: 'Select option',
        type: 'select',
        options: ['Cash Withdrawal Slot', 'Mini Statement & Balance Print', 'Doorstep Micro ATM Visit'],
        required: true,
      },
      {
        key: 'Bank & Card Type',
        label: 'Bank & Card Network',
        placeholder: 'e.g. SBI RuPay / HDFC Visa',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-jeevan-pramaan',
    categoryKey: 'banking_finance',
    categoryTitle: 'Banking & Financial Services',
    categoryTitleHi: 'बैंकिंग और वित्तीय सेवाएं',
    name: 'Jeevan Pramaan (Pensioners Life Certificate)',
    nameHi: 'जीवन प्रमाण (Pensioners Life Certificate)',
    description: 'Digital Life Certificate biometric filing and printed Pramaan ID slip for Central/State pensioners.',
    originalFee: 100,
    expressAddonFee: 50,
    turnaroundStandard: 'Same Day',
    turnaroundExpress: 'Home Biometric Visit',
    requiredHints: ['PPO Number', 'Pension Disbursing Bank', 'Aadhaar Number'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'PPO Number',
        label: 'PPO (Pension Payment Order) Number',
        placeholder: 'Enter full PPO number',
        type: 'text',
        required: true,
      },
      {
        key: 'Sanctioning Authority',
        label: 'Pension Type / Department',
        placeholder: 'e.g. Central Govt / Defence / State / EPFO',
        type: 'text',
        required: true,
      },
      {
        key: 'Pension Bank & Account',
        label: 'Disbursing Bank & Account Last 4 Digits',
        placeholder: 'e.g. SBI · A/C ending 8820',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-insurance-pension',
    categoryKey: 'banking_finance',
    categoryTitle: 'Banking & Financial Services',
    categoryTitleHi: 'बैंकिंग और वित्तीय सेवाएं',
    name: 'Insurance & Pension Schemes (PM-SYM, NPS, APY)',
    nameHi: 'बीमा (Insurance) और पेंशन योजनाएं (PM-SYM, NPS, APY)',
    description: 'Enrollment & policy renewal for PM-SYM, Atal Pension Yojana (APY), NPS, PMSBY, PMJJBY & vehicle insurance.',
    originalFee: 150,
    expressAddonFee: 50,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Policy Slip',
    requiredHints: ['Scheme / Insurance Name', 'Nominee Details', 'Age / DOB'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Birth',
      'Proof of Address',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Scheme / Policy Type',
        label: 'Select Scheme or Insurance',
        placeholder: 'Select scheme',
        type: 'select',
        options: ['PM-SYM (Shram Yogi Maandhan)', 'Atal Pension Yojana (APY)', 'NPS Registration', 'PMJJBY / PMSBY Life & Accident', 'Motor / Health Insurance Renewal'],
        required: true,
      },
      {
        key: 'Nominee Name & Relation',
        label: 'Nominee Full Name & Relationship',
        placeholder: 'e.g. Sunita Devi (Spouse)',
        type: 'text',
        required: true,
      },
      {
        key: 'Applicant DOB',
        label: 'Applicant Date of Birth',
        placeholder: 'YYYY-MM-DD',
        type: 'date',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-itr-gst',
    categoryKey: 'banking_finance',
    categoryTitle: 'Banking & Financial Services',
    categoryTitleHi: 'बैंकिंग और वित्तीय सेवाएं',
    name: 'Income Tax (ITR) Filing & GST Services',
    nameHi: 'आयकर (Income Tax) फाइलिंग और GST सेवाएं',
    description: 'ITR-1/2/3/4 e-filing, TDS verification, New GST Registration, and Monthly/Quarterly GSTR filing.',
    originalFee: 500,
    expressAddonFee: 200,
    turnaroundStandard: '2–3 Working Days',
    turnaroundExpress: 'Same Day Filing & Ack',
    requiredHints: ['PAN / GSTIN', 'Assessment Year / Month', 'Income / Business Type'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Income',
      'Proof of National Card',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Tax Service Type',
        label: 'ITR or GST Service',
        placeholder: 'Select service',
        type: 'select',
        options: ['Income Tax Return (ITR Filing)', 'New GST Registration', 'GST Monthly/Quarterly Return (GSTR-1/3B)', 'PAN-Aadhaar Link / Tax Notice Reply'],
        required: true,
      },
      {
        key: 'PAN / GSTIN',
        label: 'PAN Number / GSTIN',
        placeholder: 'e.g. ABCDE1234F or 27ABCDE1234F1Z5',
        type: 'text',
        required: true,
      },
      {
        key: 'Assessment Period',
        label: 'Assessment Year / Return Month',
        placeholder: 'e.g. AY 2026-27 or Oct 2026',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },

  // 3. सरकारी योजनाएं (Government Schemes)
  {
    id: 'srv-pm-kisan',
    categoryKey: 'govt_schemes',
    categoryTitle: 'Government Schemes',
    categoryTitleHi: 'सरकारी योजनाएं',
    name: 'PM Kisan Samman Nidhi (New, e-KYC & Status Check)',
    nameHi: 'पीएम किसान सम्मान निधि (PM Kisan)',
    description: 'New farmer registration, biometric/OTP e-KYC, land seeding verification, and installment status resolution.',
    originalFee: 100,
    expressAddonFee: 40,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day e-KYC & Print',
    requiredHints: ['PM Kisan Reg / Aadhaar', 'Khata / Khasra Number', 'Bank Account Seeded'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Residence',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'PM Kisan Service',
        label: 'PM Kisan Action Needed',
        placeholder: 'Select action',
        type: 'select',
        options: ['New Farmer Registration', 'PM Kisan e-KYC & Land Seeding', 'Beneficiary Status & Installment Correction'],
        required: true,
      },
      {
        key: 'Land Khata / Plot No.',
        label: 'Land Khata / Khasra / Plot Number',
        placeholder: 'e.g. Khata 114 / Plot 892',
        type: 'text',
        required: true,
      },
      {
        key: 'Aadhaar Last 4 Digits',
        label: 'Farmer Aadhaar Last 4 Digits',
        placeholder: 'e.g. 4821',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-ayushman-bharat',
    categoryKey: 'govt_schemes',
    categoryTitle: 'Government Schemes',
    categoryTitleHi: 'सरकारी योजनाएं',
    name: 'Ayushman Bharat / Golden Card (PM-JAY)',
    nameHi: 'आयुष्मान भारत (Ayushman Bharat / Golden Card)',
    description: 'PM-JAY eligibility verification, e-KYC card generation, family member link, and PVC Golden Card print.',
    originalFee: 100,
    expressAddonFee: 40,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Card Print',
    requiredHints: ['Ration / PMJAY ID', 'Aadhaar Number', 'Family Member Count'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Residence',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Ayushman Request',
        label: 'Ayushman Card Request Type',
        placeholder: 'Select request',
        type: 'select',
        options: ['Eligibility Check & New Golden Card', 'Add Family Member in PM-JAY', 'Download & Laminated Card Print'],
        required: true,
      },
      {
        key: 'Ration / HHID Number',
        label: 'Ration Card / Family HHID Number',
        placeholder: 'Enter Ration or PM-JAY Family ID',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-pmay',
    categoryKey: 'govt_schemes',
    categoryTitle: 'Government Schemes',
    categoryTitleHi: 'सरकारी योजनाएं',
    name: 'Pradhan Mantri Awas Yojana (PMAY Urban / Gramin)',
    nameHi: 'प्रधानमंत्री आवास योजना (PMAY)',
    description: 'PMAY housing application, beneficiary list verification, geo-tag status update, and subsidy tracking.',
    originalFee: 150,
    expressAddonFee: 50,
    turnaroundStandard: '2–3 Working Days',
    turnaroundExpress: 'Same Day Portal Filing',
    requiredHints: ['PMAY Area (Urban/Gramin)', 'Aadhaar & Family Income', 'Bank Account Details'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Income',
      'Proof of Residence',
      'Proof of Caste',
      'Applicant Photo (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'PMAY Category',
        label: 'PMAY Scheme Type',
        placeholder: 'Select category',
        type: 'select',
        options: ['PMAY-G (Gramin / Rural)', 'PMAY-U (Urban)', 'Beneficiary Status & Installment Check'],
        required: true,
      },
      {
        key: 'Ward / Gram Panchayat',
        label: 'Gram Panchayat / Municipal Ward',
        placeholder: 'Enter Panchayat or Ward name',
        type: 'text',
        required: true,
      },
      {
        key: 'Annual Household Income',
        label: 'Annual Family Income',
        placeholder: 'e.g. ₹1,20,000',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-tele-law-med',
    categoryKey: 'govt_schemes',
    categoryTitle: 'Government Schemes',
    categoryTitleHi: 'सरकारी योजनाएं',
    name: 'Tele-Law Legal Consultation & Tele-Medicine Slot',
    nameHi: 'टेली-लॉ (Tele-Law) और टेली-मेडिसिन (Tele-medicine)',
    description: 'Schedule video consultation with Panel Advocates (Tele-Law) or Certified Doctors (e-Sanjeevani / Tele-Medicine).',
    originalFee: 100,
    expressAddonFee: 50,
    turnaroundStandard: 'Next Available Slot (24h)',
    turnaroundExpress: 'Priority Same-Day Call',
    requiredHints: ['Consultation Type', 'Brief Concern / Case Note', 'Preferred Time Slot'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Disability',
      'Proof of Residence',
    ],
    customFields: [
      {
        key: 'Consultation Mode',
        label: 'Select Consultation Service',
        placeholder: 'Select service',
        type: 'select',
        options: ['Tele-Law (Advocate Legal Advice)', 'Tele-Medicine (Doctor Consultation)'],
        required: true,
      },
      {
        key: 'Preferred Time Window',
        label: 'Preferred Consultation Window',
        placeholder: 'Select slot',
        type: 'select',
        options: ['Morning (10 AM – 1 PM)', 'Afternoon (2 PM – 5 PM)', 'Evening (5 PM – 7 PM)'],
        required: true,
      },
      {
        key: 'Case / Symptom Summary',
        label: 'Brief Legal Matter or Health Concern',
        placeholder: 'Describe briefly for case registration',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },

  // 4. शिक्षा और रोजगार (Education & Jobs)
  {
    id: 'srv-govt-job',
    categoryKey: 'education_jobs',
    categoryTitle: 'Education & Jobs',
    categoryTitleHi: 'शिक्षा और रोजगार',
    name: 'Government Job Online Application (SSC, UPSC, Railway, State)',
    nameHi: 'सरकारी नौकरी (Govt Job) के आवेदन',
    description: 'Accurate online form submission, photo/signature resizing, category certificate upload, and admit/ack slip.',
    originalFee: 150,
    expressAddonFee: 60,
    turnaroundStandard: 'Same Day Filing',
    turnaroundExpress: 'Immediate Deadline Priority',
    requiredHints: ['Exam / Vacancy Name', 'Highest Qualification', 'Category (Gen/OBC/SC/ST)'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Birth',
      'Proof of Caste',
      'Proof of Disability',
      'Proof of Residence',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Recruitment / Vacancy Name',
        label: 'Department & Post Name',
        placeholder: 'e.g. SSC CGL / RRB NTPC / Police Constable',
        type: 'text',
        required: true,
      },
      {
        key: 'Category & Qualification',
        label: 'Category & Highest Qualification',
        placeholder: 'e.g. OBC-NCL · Graduate (B.Sc)',
        type: 'text',
        required: true,
      },
      {
        key: 'Application Deadline',
        label: 'Last Date of Form',
        placeholder: 'YYYY-MM-DD',
        type: 'date',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-exam-nios-ignou',
    categoryKey: 'education_jobs',
    categoryTitle: 'Education & Jobs',
    categoryTitleHi: 'शिक्षा और रोजगार',
    name: 'Exam Forms, NIOS & IGNOU Registration / Assignment',
    nameHi: 'परीक्षा फॉर्म, NIOS, और IGNOU पंजीकरण',
    description: 'NIOS 10th/12th admission & TMA upload, IGNOU fresh admission / re-registration, and university exam forms.',
    originalFee: 250,
    expressAddonFee: 80,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Submission',
    requiredHints: ['Board / University', 'Course / Stream', 'Enrollment Number (if any)'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Birth',
      'Proof of Nationality',
      'Proof of Caste',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Institution / Portal',
        label: 'Board / University Type',
        placeholder: 'Select option',
        type: 'select',
        options: ['NIOS Admission / Exam Form', 'IGNOU Admission / Re-Registration', 'University / Competitive Exam Form'],
        required: true,
      },
      {
        key: 'Course & Subjects',
        label: 'Program / Class & Subject Codes',
        placeholder: 'e.g. IGNOU BAG Semester 3 or NIOS 12th Arts',
        type: 'text',
        required: true,
      },
      {
        key: 'Enrollment / Reg No.',
        label: 'Existing Enrollment No. (if re-registration)',
        placeholder: 'Enrollment number or New Admission',
        type: 'text',
      },
    ],
    active: true,
  },
  {
    id: 'srv-scholarship',
    categoryKey: 'education_jobs',
    categoryTitle: 'Education & Jobs',
    categoryTitleHi: 'शिक्षा और रोजगार',
    name: 'Scholarship Registration (NSP & State Portals)',
    nameHi: 'छात्रवृत्ति (Scholarship) पंजीकरण',
    description: 'National Scholarship Portal (NSP) & State Pre/Post-Matric scholarship fresh or renewal form with institute verification slip.',
    originalFee: 150,
    expressAddonFee: 50,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Filing',
    requiredHints: ['Scholarship Portal', 'School / College Name', 'Annual Family Income'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Income',
      'Proof of Caste',
      'Proof of Residence',
      'Proof of Disability',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Scholarship Portal',
        label: 'Portal & Type',
        placeholder: 'Select option',
        type: 'select',
        options: ['NSP Fresh Application', 'NSP Renewal', 'State Post-Matric Scholarship', 'Minority / Merit Scholarship'],
        required: true,
      },
      {
        key: 'Institute & Class',
        label: 'School / College Name & Current Class/Year',
        placeholder: 'e.g. City Degree College · B.A. 2nd Year',
        type: 'text',
        required: true,
      },
      {
        key: 'Previous Exam Percentage',
        label: 'Last Passed Exam Marks %',
        placeholder: 'e.g. 78.5%',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },

  // 5. व्यापार, यात्रा और अन्य सेवाएं (Business & Travel)
  {
    id: 'srv-fssai-msme',
    categoryKey: 'business_travel',
    categoryTitle: 'Business & Travel',
    categoryTitleHi: 'व्यापार, यात्रा और अन्य सेवाएं',
    name: 'FSSAI (FoSCoS) Food License & MSME Udyam Registration',
    nameHi: 'FSSAI (Foscos) लाइसेंस और MSME पंजीकरण',
    description: 'Official FoSCoS food business registration/renewal and MSME Udyam certificate with NIC activity code mapping.',
    originalFee: 500,
    expressAddonFee: 200,
    turnaroundStandard: '2–4 Working Days',
    turnaroundExpress: 'Same Day Filing & Receipt',
    requiredHints: ['Business / Shop Name', 'License Type', 'Nature of Business'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Residence',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Registration Type',
        label: 'License / Registration Needed',
        placeholder: 'Select option',
        type: 'select',
        options: ['FSSAI Basic Registration (FoSCoS)', 'FSSAI State License / Renewal', 'MSME Udyam Registration', 'Both FSSAI + MSME Combo'],
        required: true,
      },
      {
        key: 'Business / Trade Name',
        label: 'Shop / Enterprise Legal Name',
        placeholder: 'e.g. Annapurna Foods & Traders',
        type: 'text',
        required: true,
      },
      {
        key: 'Business Activity & Turnover',
        label: 'Business Activity & Annual Turnover Est.',
        placeholder: 'e.g. Grocery Retail / Dairy · Under ₹12 Lakh',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-irctc-flight',
    categoryKey: 'business_travel',
    categoryTitle: 'Business & Travel',
    categoryTitleHi: 'व्यापार, यात्रा और अन्य सेवाएं',
    name: 'IRCTC Train & Flight Ticket Booking',
    nameHi: 'IRCTC ट्रेन और फ्लाइट टिकट बुकिंग',
    description: 'Authorized CSC IRCTC railway e-ticket (General / Tatkal slot) and domestic/international flight booking with confirmed itinerary slip.',
    originalFee: 200,
    expressAddonFee: 100,
    turnaroundStandard: 'Instant / Same Day',
    turnaroundExpress: 'Tatkal / Priority Desk Slot',
    requiredHints: ['From & To Station/Airport', 'Travel Date & Class', 'Passenger Count & Ages'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Nationality',
      'Proof of National Card',
    ],
    customFields: [
      {
        key: 'Travel Mode',
        label: 'Booking Type',
        placeholder: 'Select mode',
        type: 'select',
        options: ['IRCTC Train Ticket (General)', 'IRCTC Tatkal Train Ticket', 'Domestic Flight Ticket', 'International Flight Ticket'],
        required: true,
      },
      {
        key: 'Route (From -> To)',
        label: 'Origin & Destination Station / Airport',
        placeholder: 'e.g. Howrah (HWH) to New Delhi (NDLS)',
        type: 'text',
        required: true,
      },
      {
        key: 'Journey Date & Class',
        label: 'Journey Date & Preferred Class',
        placeholder: 'e.g. 2026-11-22 · 3AC / Economy',
        type: 'text',
        required: true,
      },
      {
        key: 'Passenger Names & Ages',
        label: 'Passenger Names, Age & Gender',
        placeholder: 'e.g. Amit Das (34 M), Priya Das (30 F)',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-land-records',
    categoryKey: 'business_travel',
    categoryTitle: 'Business & Travel',
    categoryTitleHi: 'व्यापार, यात्रा और अन्य सेवाएं',
    name: 'Land Records / Banglarbhumi ROR & Mutation',
    nameHi: 'भूमि अभिलेख (Land Records / Banglarbhumi ROR)',
    description: 'Certified Khatian / Dag ROR (Porcha) extract, plot map, mutation application, and land revenue receipt processing.',
    originalFee: 200,
    expressAddonFee: 80,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Certified Print',
    requiredHints: ['District & Block/Mouza', 'Khatian & Dag/Plot Number', 'Record Type'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Residence',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'Land Record Service',
        label: 'Land Service Required',
        placeholder: 'Select option',
        type: 'select',
        options: ['ROR / Khatian Certified Copy (Porcha)', 'Plot / Dag Information & Map', 'Land Mutation / Conversion Filing', 'Land Revenue (Khajna) Payment'],
        required: true,
      },
      {
        key: 'District / Block / Mouza',
        label: 'District, Block & Mouza Name (JL No.)',
        placeholder: 'e.g. North 24 Parganas · Barasat · Mouza 42',
        type: 'text',
        required: true,
      },
      {
        key: 'Khatian / Plot Number',
        label: 'Khatian No. & Dag / Plot No.',
        placeholder: 'e.g. Khatian 1042 · Dag 318',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
  {
    id: 'srv-dsc',
    categoryKey: 'business_travel',
    categoryTitle: 'Business & Travel',
    categoryTitleHi: 'व्यापार, यात्रा और अन्य सेवाएं',
    name: 'Digital Signature Certificate (Class-3 DSC + USB Token)',
    nameHi: 'डिजिटल हस्ताक्षर (Digital Signature - DSC)',
    description: 'Class-3 Individual or Organization DSC (2-Year Validity) for e-Tender, MCA, GST, Income Tax & EPFO with physical USB token.',
    originalFee: 1200,
    expressAddonFee: 300,
    turnaroundStandard: '1–2 Working Days',
    turnaroundExpress: 'Same Day Video KYC & Token',
    requiredHints: ['DSC Class & Validity', 'PAN & Organization Name', 'Token Requirement'],
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Proof of Nationality',
      'Proof of National Card',
      'Applicant Photo (Max 1 MB)',
      'Applicant Signature (Max 1 MB)',
    ],
    customFields: [
      {
        key: 'DSC Type',
        label: 'DSC Certificate Type',
        placeholder: 'Select DSC type',
        type: 'select',
        options: ['Class-3 Signing Only (2 Years)', 'Class-3 Signing + Encryption Combo (2 Years)', 'DGFT DSC'],
        required: true,
      },
      {
        key: 'USB Token Needed',
        label: 'Cryptographic USB Token',
        placeholder: 'Select option',
        type: 'select',
        options: ['Yes — New FIPS USB Token Included', 'No — Download into My Existing Token'],
        required: true,
      },
      {
        key: 'PAN & Firm Name',
        label: 'Applicant PAN & Firm Name (if Org DSC)',
        placeholder: 'e.g. ABCDE1234F · Individual / Firm Name',
        type: 'text',
        required: true,
      },
    ],
    active: true,
  },
];

const DEFAULT_STORE: StoreData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: {
    businessName: 'Mr Ashraf Banking Traveling Communication',
    ownerName: 'Mr. Ashraf',
    ownerWhatsapp: '918755106587',
    supportEmail: 'desk@mrashrafbtc.example',
    officeAddress: 'Main Citizen Banking & Travel Counter, Market Road',
    currencySymbol: '₹',
    platformChargePercent: 20,
    upiId: '8755106587@ptsbi',
    upiPayeeName: 'MR ASHRAF BANKING TRAVELING COMMUNICATION',
    bankDetails: 'SBI / HDFC · A/C 50200048192014 · IFSC HDFC0001204',
    ownerPasscode: 'Ashraful786$',
  },
  services: DEFAULT_SERVICES,
  requests: [
    {
      id: 'req-demo-1001',
      requestNumber: 'SRV-2026-1001',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      status: 'slip_issued',
      serviceId: 'srv-certificates',
      serviceName: 'Birth, Death, Income, Caste & Residence Certificate',
      serviceCategory: 'Identity & Certificates',
      processingSpeed: 'express',
      customerName: 'Rohan Kulkarni',
      customerWhatsapp: '919820112233',
      customerEmail: 'rohan.k@example.com',
      customerAddress: '14 Lotus Residency, MG Road',
      customerCity: 'Pune',
      customerPostalCode: '411001',
      subjectTitle: 'Income Certificate for College Scholarship',
      quantity: 1,
      preferredDate: new Date().toISOString().slice(0, 10),
      referenceCode: 'EDIST-2026-88',
      detailedInstructions: 'Need signed e-District physical printout with stamp.',
      customDetails: {
        'Certificate Type': 'Income Certificate (आय)',
        'Tehsil / Block': 'Haveli Tehsil',
        'Parent / Spouse Name': 'Suresh Kulkarni',
        'Purpose / Income Figure': 'Scholarship · ₹96,000/yr',
      },
      requiredDocuments: [
        'Proof of Identity',
        'Proof of Address',
        'Proof of Birth',
        'Proof of Caste',
        'Proof of Income',
        'Proof of Residence',
        'Applicant Photo (Max 1 MB)',
        'Applicant Signature (Max 1 MB)',
      ],
      customerConfirmedDocuments: [
        'Proof of Identity',
        'Proof of Address',
        'Proof of Birth',
        'Proof of Income',
        'Proof of Residence',
        'Applicant Photo (Max 1 MB)',
        'Applicant Signature (Max 1 MB)',
      ],
      uploadedDocuments: {},
      documentsChecklist: {
        'Proof of Identity': 'verified',
        'Proof of Address': 'verified',
        'Proof of Birth': 'verified',
        'Proof of Caste': 'pending',
        'Proof of Income': 'verified',
        'Proof of Residence': 'verified',
        'Applicant Photo (Max 1 MB)': 'verified',
        'Applicant Signature (Max 1 MB)': 'verified',
      },
      documentsReviewNote: 'Identity, address, income, residence, photo & signature verified.',
      originalFee: 200,
      platformCharge: 40,
      platformChargePercent: 20,
      expressFee: 80,
      totalAmount: 320,
      currencySymbol: '₹',
      paymentMethod: 'upi',
      paymentReference: 'UTR631948201944',
      payerName: 'Rohan Kulkarni',
      paymentCompletedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      paymentStatus: 'approved',
      paymentReviewNote: 'UTR631948201944 matched ₹320 on 8755106587@ptsbi.',
      paymentReviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      verification: {
        detailsVerified: true,
        specsVerified: true,
        paymentVerified: true,
        verificationNotes: 'Original fee ₹200 + 20% platform charge ₹40 + Express ₹80 verified on UPI.',
        verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        verifiedBy: 'Mr. Ashraf',
      },
      physicalProcessing: {
        handlerName: 'Imran S.',
        deskCounter: 'e-District Counter 2',
        expectedCompletion: new Date().toISOString().slice(0, 10),
        processingNotes: 'e-District portal application filed, attested copy printed & sealed.',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      slip: {
        slipNumber: 'SLP-2026-4101',
        issuedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        verificationCode: 'VRF-8A4C-91F2',
        finalRemarks: 'Certificate physically processed, stamped, and ready for pickup / PDF download.',
        issuedBy: 'Mr. Ashraf',
      },
    },
    {
      id: 'req-demo-1002',
      requestNumber: 'SRV-2026-1002',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      status: 'payment_submitted',
      serviceId: 'srv-land-records',
      serviceName: 'Land Records / Banglarbhumi ROR & Mutation',
      serviceCategory: 'Business & Travel',
      processingSpeed: 'standard',
      customerName: 'Ananya Chatterjee',
      customerWhatsapp: '919745009988',
      customerEmail: 'ananya.c@example.com',
      customerAddress: '42 Station Para, Barasat',
      customerCity: 'North 24 Parganas',
      customerPostalCode: '700124',
      subjectTitle: 'Certified Khatian ROR Porcha Copy',
      quantity: 2,
      preferredDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      referenceCode: 'JL-42',
      detailedInstructions: 'Please provide 2 signed ROR certified copies for bank loan file.',
      customDetails: {
        'Land Record Service': 'ROR / Khatian Certified Copy (Porcha)',
        'District / Block / Mouza': 'North 24 Parganas · Barasat · Mouza 42',
        'Khatian / Plot Number': 'Khatian 1042 · Dag 318',
      },
      requiredDocuments: [
        'Proof of Identity',
        'Proof of Address',
        'Proof of Residence',
        'Applicant Signature (Max 1 MB)',
      ],
      customerConfirmedDocuments: [
        'Proof of Identity',
        'Proof of Address',
        'Proof of Residence',
      ],
      uploadedDocuments: {},
      documentsChecklist: {
        'Proof of Identity': 'pending',
        'Proof of Address': 'pending',
        'Proof of Residence': 'pending',
        'Applicant Signature (Max 1 MB)': 'pending',
      },
      documentsReviewNote: '',
      originalFee: 400,
      platformCharge: 80,
      platformChargePercent: 20,
      expressFee: 0,
      totalAmount: 480,
      currencySymbol: '₹',
      paymentMethod: 'upi',
      paymentReference: 'UTR631955019283',
      payerName: 'Ananya Chatterjee',
      paymentCompletedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      paymentStatus: 'pending',
      paymentReviewNote: '',
      paymentReviewedAt: null,
      verification: {
        detailsVerified: false,
        specsVerified: false,
        paymentVerified: false,
        verificationNotes: '',
        verifiedAt: null,
        verifiedBy: null,
      },
      physicalProcessing: {
        handlerName: '',
        deskCounter: '',
        expectedCompletion: '',
        processingNotes: '',
        startedAt: null,
      },
      slip: null,
      chatMessages: [],
    },
  ],
  users: [],
  sessionSecret: crypto.randomBytes(32).toString('hex'),
  sequenceCounter: 1002,
  slipCounter: 4101,
};

function ensureStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
    return structuredClone(DEFAULT_STORE);
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      return structuredClone(DEFAULT_STORE);
    }
    if (parsed.schemaVersion < CURRENT_SCHEMA_VERSION) {
      parsed.schemaVersion = CURRENT_SCHEMA_VERSION;
      parsed.settings.upiId = '8755106587@ptsbi';
      parsed.settings.upiPayeeName = 'MR ASHRAF BANKING TRAVELING COMMUNICATION';
      parsed.settings.ownerPasscode = 'Ashraful786$';
      if (parsed.settings.ownerWhatsapp === '919876543210') {
        parsed.settings.ownerWhatsapp = '918755106587';
      }
      const defaultDocsById = new Map(
        DEFAULT_SERVICES.map((s) => [s.id, s.requiredDocuments])
      );
      parsed.services = (parsed.services || []).map((srv) => ({
        ...srv,
        requiredDocuments:
          defaultDocsById.get(srv.id) ||
          (Array.isArray(srv.requiredDocuments) && srv.requiredDocuments.length > 0
            ? srv.requiredDocuments
            : ['Proof of Identity', 'Applicant Photo (Max 1 MB)']),
      }));
      parsed.requests = (parsed.requests || []).map((req) => {
        const docs =
          defaultDocsById.get(req.serviceId) ||
          (Array.isArray(req.requiredDocuments) && req.requiredDocuments.length > 0
            ? req.requiredDocuments
            : ['Proof of Identity']);
        const isPaidApproved =
          req.paymentStatus === 'approved' ||
          req.verification?.paymentVerified ||
          req.status === 'verified' ||
          req.status === 'processing_physically' ||
          req.status === 'slip_issued';
        const defaultChecklist: Record<string, DocumentStatus> = {};
        for (const d of docs) {
          defaultChecklist[d] =
            req.documentsChecklist?.[d] || (isPaidApproved ? 'verified' : 'pending');
        }
        return {
          ...req,
          requiredDocuments: docs,
          customerConfirmedDocuments: Array.isArray(req.customerConfirmedDocuments)
            ? req.customerConfirmedDocuments
            : isPaidApproved
            ? [...docs]
            : [],
          uploadedDocuments: req.uploadedDocuments || {},
          documentsChecklist: defaultChecklist,
          documentsReviewNote: req.documentsReviewNote || '',
          paymentStatus: req.paymentStatus || (isPaidApproved ? 'approved' : 'pending'),
          paymentReviewNote: req.paymentReviewNote || '',
          paymentReviewedAt: req.paymentReviewedAt ?? (isPaidApproved ? req.verification?.verifiedAt || req.updatedAt : null),
          chatMessages: Array.isArray(req.chatMessages) ? req.chatMessages : [],
        };
      });
      if (!Array.isArray(parsed.users)) parsed.users = [];
      if (!parsed.sessionSecret) parsed.sessionSecret = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    if (!Array.isArray(parsed.users)) parsed.users = [];
    if (!parsed.sessionSecret) {
      parsed.sessionSecret = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
    return structuredClone(DEFAULT_STORE);
  }
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function sanitizePhone(phone: string): string {
  return String(phone || '').replace(/[^\d]/g, '');
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 32).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 32);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

function signCustomerToken(userId: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, iat: Date.now() }),
    'utf-8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyCustomerToken(token: string, secret: string): string | null {
  try {
    const [payload, sig] = String(token || '').split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub?: string;
    };
    return parsed.sub || null;
  } catch {
    return null;
  }
}

function sanitizeCustomer(user: StoredCustomerAccount): CustomerAccount {
  const { passwordHash: _h, passwordSalt: _s, ...pub } = user;
  return pub;
}

function isChatUnlocked(req: ServiceRequest): boolean {
  return req.status !== 'rejected' && req.paymentStatus !== 'rejected';
}

function findUserRequests(store: StoreData, user: CustomerAccount): ServiceRequest[] {
  const userDigits = sanitizePhone(user.phone);
  const userEmail = (user.email || '').trim().toLowerCase();
  return store.requests
    .filter((r) => {
      if (r.customerUserId && r.customerUserId === user.id) return true;
      if (userDigits.length >= 10 && sanitizePhone(r.customerWhatsapp).endsWith(userDigits.slice(-10))) {
        return true;
      }
      if (userEmail && (r.customerEmail || '').trim().toLowerCase() === userEmail) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const roomSubscribers = new Map<string, Set<WebSocket>>();

  server.on('upgrade', (request, socket, head) => {
    if (request.url && request.url.startsWith('/ws/chat')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    const subscribedRooms = new Set<string>();
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; requestId?: string };
        if (msg.type === 'subscribe' && msg.requestId) {
          const rid = String(msg.requestId);
          subscribedRooms.add(rid);
          if (!roomSubscribers.has(rid)) {
            roomSubscribers.set(rid, new Set());
          }
          roomSubscribers.get(rid)!.add(ws);
        } else if (msg.type === 'unsubscribe' && msg.requestId) {
          const rid = String(msg.requestId);
          subscribedRooms.delete(rid);
          roomSubscribers.get(rid)?.delete(ws);
        }
      } catch {
        // Ignore invalid socket JSON
      }
    });
    ws.on('close', () => {
      subscribedRooms.forEach((rid) => {
        roomSubscribers.get(rid)?.delete(ws);
      });
    });
  });

  const broadcastToRequestRoom = (requestId: string, payload: unknown) => {
    const subs = roomSubscribers.get(requestId);
    if (!subs || subs.size === 0) return;
    const data = JSON.stringify(payload);
    subs.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  app.use(express.json({ limit: '5mb' }));

  const checkOwnerAuth = (req: express.Request, store: StoreData): boolean => {
    const pass = String(req.headers['x-owner-passcode'] || '');
    return pass === store.settings.ownerPasscode;
  };

  const getCustomerFromReq = (
    req: express.Request,
    store: StoreData
  ): StoredCustomerAccount | null => {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    const userId = verifyCustomerToken(token, store.sessionSecret);
    if (!userId) return null;
    return store.users.find((u) => u.id === userId) || null;
  };

  // Document Upload (JPG / JPEG / PNG / PDF) with strict 1 MB cap for Photos & Signature
  app.post('/api/uploads', (req, res) => {
    try {
      const body = req.body || {};
      const docName = String(body.docName || 'Supporting Document').trim();
      const originalName = String(body.fileName || 'document').trim();
      const mimeType = String(body.mimeType || '').toLowerCase().trim();
      const dataBase64 = String(body.dataBase64 || '').trim();

      const allowedMimes = new Map<string, string>([
        ['image/jpeg', 'jpg'],
        ['image/jpg', 'jpg'],
        ['image/png', 'png'],
        ['application/pdf', 'pdf'],
      ]);
      const extFromMime = allowedMimes.get(mimeType);
      const rawExt = path.extname(originalName).replace('.', '').toLowerCase();
      const validExt =
        extFromMime ||
        (['jpg', 'jpeg', 'png', 'pdf'].includes(rawExt) ? (rawExt === 'jpeg' ? 'jpg' : rawExt) : null);

      if (!validExt || (!allowedMimes.has(mimeType) && !['jpg', 'jpeg', 'png', 'pdf'].includes(rawExt))) {
        res.status(400).json({
          error: 'Only JPG, JPEG, PNG, or PDF files are allowed.',
        });
        return;
      }

      if (!dataBase64) {
        res.status(400).json({ error: 'Uploaded file payload is empty.' });
        return;
      }

      const cleanedBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      const buffer = Buffer.from(cleanedBase64, 'base64');
      if (buffer.length === 0) {
        res.status(400).json({ error: 'Invalid uploaded file content.' });
        return;
      }

      const meta = getDocumentMeta(docName);
      if (buffer.length > meta.maxSizeBytes) {
        res.status(400).json({
          error: `${docName} exceeds the ${meta.maxSizeLabel} limit. Uploaded file is ${Math.ceil(
            buffer.length / 1024
          )} KB.`,
        });
        return;
      }

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const safeFileName = `${crypto.randomUUID()}.${validExt}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, safeFileName), buffer);

      const resolvedMime =
        validExt === 'pdf' ? 'application/pdf' : validExt === 'png' ? 'image/png' : 'image/jpeg';

      const fileRecord: UploadedDocumentFile = {
        docName,
        fileName: safeFileName,
        originalName,
        mimeType: resolvedMime,
        sizeBytes: buffer.length,
        url: `/api/uploads/${safeFileName}`,
        uploadedAt: new Date().toISOString(),
      };

      res.status(201).json({ file: fileRecord });
    } catch {
      res.status(500).json({ error: 'Failed to store uploaded document.' });
    }
  });

  app.get('/api/uploads/:fileName', (req, res) => {
    const safeName = path.basename(String(req.params.fileName || ''));
    const fullPath = path.join(UPLOADS_DIR, safeName);
    if (!safeName || !fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Document file not found.' });
      return;
    }
    res.sendFile(fullPath);
  });

  app.get('/api/bootstrap', (_req, res) => {
    const store = ensureStore();
    const { ownerPasscode: _hidden, ...publicSettings } = store.settings;
    res.json({
      settings: publicSettings,
      services: store.services.filter((s) => s.active),
      stats: {
        totalRequests: store.requests.length,
        slipsIssued: store.requests.filter((r) => r.status === 'slip_issued').length,
        activeProcessing: store.requests.filter(
          (r) => r.status === 'verified' || r.status === 'processing_physically'
        ).length,
      },
    });
  });

  // Customer Account Auth: Sign Up / Sign In (Phone Number, Gmail, Facebook) + Profile
  app.post('/api/auth/register', (req, res) => {
    const store = ensureStore();
    const body = req.body || {};
    const authProviderRaw = String(body.authProvider || 'phone').toLowerCase();
    const authProvider: AuthProviderType =
      authProviderRaw === 'gmail' || authProviderRaw === 'facebook' ? authProviderRaw : 'phone';

    if (body.acceptedTerms !== true) {
      res.status(400).json({
        error: 'You must read and accept the Required Terms & Conditions before creating an account.',
      });
      return;
    }

    const fullName = String(body.fullName || '').trim();
    const phone = sanitizePhone(String(body.phone || ''));
    const email = String(body.email || '').trim().toLowerCase();
    const facebookHandle = String(body.facebookHandle || '').trim();
    const password = String(body.password || '');

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: 'Please create a password (at least 4 characters).' });
      return;
    }
    if (authProvider === 'phone' && phone.length < 10) {
      res.status(400).json({ error: 'Please enter a valid 10+ digit Phone Number.' });
      return;
    }
    if (authProvider === 'gmail' && (!email || !email.includes('@'))) {
      res.status(400).json({ error: 'Please enter a valid Gmail / Email address.' });
      return;
    }
    if (authProvider === 'facebook' && facebookHandle.length < 3) {
      res.status(400).json({ error: 'Please enter your Facebook ID / Profile Name or Email.' });
      return;
    }

    const duplicate = store.users.find(
      (u) =>
        (phone.length >= 10 && sanitizePhone(u.phone) === phone) ||
        (email && u.email.toLowerCase() === email) ||
        (facebookHandle &&
          u.facebookHandle &&
          u.facebookHandle.toLowerCase() === facebookHandle.toLowerCase())
    );
    if (duplicate) {
      res.status(409).json({
        error: 'An account already exists with this Phone Number / Gmail / Facebook ID. Please Sign In instead.',
      });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const rawPhotoUrl = String(body.photoUrl || '').trim();
    const photoUrl = rawPhotoUrl.startsWith('/api/uploads/') ? rawPhotoUrl : null;

    const newUser: StoredCustomerAccount = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      authProvider,
      fullName,
      phone,
      email,
      facebookHandle,
      photoUrl,
      dateOfBirth: String(body.dateOfBirth || '').trim(),
      gender: String(body.gender || '').trim(),
      guardianName: String(body.guardianName || '').trim(),
      address: String(body.address || '').trim(),
      city: String(body.city || '').trim(),
      postalCode: String(body.postalCode || '').trim(),
      bioNotes: String(body.bioNotes || '').trim(),
      acceptedTerms: true,
      acceptedTermsAt: now,
      createdAt: now,
      updatedAt: now,
      passwordHash: hash,
      passwordSalt: salt,
    };

    store.users.unshift(newUser);
    saveStore(store);

    const token = signCustomerToken(newUser.id, store.sessionSecret);
    const pubUser = sanitizeCustomer(newUser);
    res.status(201).json({
      token,
      user: pubUser,
      myRequests: findUserRequests(store, pubUser),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const store = ensureStore();
    const body = req.body || {};
    const authProviderRaw = String(body.authProvider || 'phone').toLowerCase();
    const authProvider: AuthProviderType =
      authProviderRaw === 'gmail' || authProviderRaw === 'facebook' ? authProviderRaw : 'phone';
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your login identifier and password.' });
      return;
    }

    const digits = sanitizePhone(identifier);
    const lowerId = identifier.toLowerCase();
    const user = store.users.find((u) => {
      if (authProvider === 'phone') {
        return digits.length >= 6 && sanitizePhone(u.phone).endsWith(digits.slice(-10));
      }
      if (authProvider === 'gmail') {
        return u.email.toLowerCase() === lowerId;
      }
      return (
        (u.facebookHandle && u.facebookHandle.toLowerCase() === lowerId) ||
        (u.email && u.email.toLowerCase() === lowerId)
      );
    });

    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid credentials. Please check your Phone / Gmail / Facebook ID and password.' });
      return;
    }

    const token = signCustomerToken(user.id, store.sessionSecret);
    const pubUser = sanitizeCustomer(user);
    res.json({
      token,
      user: pubUser,
      myRequests: findUserRequests(store, pubUser),
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const store = ensureStore();
    const user = getCustomerFromReq(req, store);
    if (!user) {
      res.status(401).json({ error: 'Session expired or not signed in.' });
      return;
    }
    const pubUser = sanitizeCustomer(user);
    res.json({
      user: pubUser,
      myRequests: findUserRequests(store, pubUser),
    });
  });

  app.patch('/api/auth/profile', (req, res) => {
    const store = ensureStore();
    const user = getCustomerFromReq(req, store);
    if (!user) {
      res.status(401).json({ error: 'Please sign in to update your profile.' });
      return;
    }
    const body = req.body || {};
    if (typeof body.fullName === 'string' && body.fullName.trim().length >= 2) {
      user.fullName = body.fullName.trim();
    }
    if (typeof body.phone === 'string') user.phone = sanitizePhone(body.phone) || user.phone;
    if (typeof body.email === 'string') user.email = body.email.trim().toLowerCase();
    if (typeof body.facebookHandle === 'string') user.facebookHandle = body.facebookHandle.trim();
    if (body.photoUrl === null) {
      user.photoUrl = null;
    } else if (typeof body.photoUrl === 'string' && body.photoUrl.startsWith('/api/uploads/')) {
      user.photoUrl = body.photoUrl;
    }
    if (typeof body.dateOfBirth === 'string') user.dateOfBirth = body.dateOfBirth.trim();
    if (typeof body.gender === 'string') user.gender = body.gender.trim();
    if (typeof body.guardianName === 'string') user.guardianName = body.guardianName.trim();
    if (typeof body.address === 'string') user.address = body.address.trim();
    if (typeof body.city === 'string') user.city = body.city.trim();
    if (typeof body.postalCode === 'string') user.postalCode = body.postalCode.trim();
    if (typeof body.bioNotes === 'string') user.bioNotes = body.bioNotes.trim();
    user.updatedAt = new Date().toISOString();

    saveStore(store);
    const pubUser = sanitizeCustomer(user);
    res.json({
      user: pubUser,
      myRequests: findUserRequests(store, pubUser),
    });
  });

  app.get('/api/track', (req, res) => {
    const query = String(req.query.ref || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Please enter a Request ID or Mobile number.' });
      return;
    }
    const store = ensureStore();
    const normalizedDigits = sanitizePhone(query);
    const upperQuery = query.toUpperCase();

    const matches = store.requests.filter((item) => {
      if (item.requestNumber.toUpperCase() === upperQuery) return true;
      if (item.slip?.slipNumber.toUpperCase() === upperQuery) return true;
      if (normalizedDigits.length >= 6 && sanitizePhone(item.customerWhatsapp).endsWith(normalizedDigits.slice(-8))) {
        return true;
      }
      return false;
    });

    res.json({
      requests: matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  });

  app.post('/api/requests', (req, res) => {
    const store = ensureStore();
    const body = req.body || {};

    const service = store.services.find((s) => s.id === body.serviceId && s.active);
    if (!service) {
      res.status(400).json({ error: 'Selected service package is unavailable.' });
      return;
    }

    const customerName = String(body.customerName || '').trim();
    const customerWhatsapp = sanitizePhone(String(body.customerWhatsapp || ''));
    const customerEmail = String(body.customerEmail || '').trim();
    const customerAddress = String(body.customerAddress || '').trim();
    const customerCity = String(body.customerCity || '').trim();
    const customerPostalCode = String(body.customerPostalCode || '').trim();
    const subjectTitle = String(body.subjectTitle || service.name).trim();
    const detailedInstructions = String(body.detailedInstructions || '').trim();
    const paymentReference = String(body.paymentReference || '').trim();
    const payerName = String(body.payerName || customerName).trim();

    if (!customerName || customerWhatsapp.length < 8 || !customerAddress || !paymentReference) {
      res.status(400).json({
        error: 'Please complete all required customer details, service boxes, and payment reference.',
      });
      return;
    }

    const rawCustom = body.customDetails && typeof body.customDetails === 'object' ? body.customDetails : {};
    const customDetails: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawCustom)) {
      const cleanVal = String(v ?? '').trim();
      if (cleanVal) {
        customDetails[String(k)] = cleanVal;
      }
    }

    const processingSpeed: ProcessingSpeed = body.processingSpeed === 'express' ? 'express' : 'standard';
    const paymentMethod: PaymentMethod =
      body.paymentMethod === 'bank_transfer' || body.paymentMethod === 'card' ? body.paymentMethod : 'upi';
    const quantity = Math.max(1, Math.min(100, Number(body.quantity) || 1));

    const platformChargePercent = store.settings.platformChargePercent ?? 20;
    const originalFee = service.originalFee * quantity;
    const platformCharge = Math.round((originalFee * platformChargePercent) / 100);
    const expressFee = processingSpeed === 'express' ? service.expressAddonFee : 0;
    const totalAmount = originalFee + platformCharge + expressFee;

    store.sequenceCounter += 1;
    const year = new Date().getFullYear();
    const requestNumber = `SRV-${year}-${store.sequenceCounter}`;
    const now = new Date().toISOString();

    const serviceDocs = Array.isArray(service.requiredDocuments) ? service.requiredDocuments : [];
    const allowedUploadSlots = [...serviceDocs, ...EXTRA_OTHER_DOCUMENT_NAMES];
    const rawUploaded =
      body.uploadedDocuments && typeof body.uploadedDocuments === 'object'
        ? (body.uploadedDocuments as Record<string, UploadedDocumentFile>)
        : {};
    const uploadedDocuments: Record<string, UploadedDocumentFile> = {};
    for (const d of allowedUploadSlots) {
      const candidate = rawUploaded[d];
      if (candidate && typeof candidate === 'object' && candidate.url && candidate.fileName) {
        uploadedDocuments[d] = {
          docName: d,
          fileName: path.basename(String(candidate.fileName)),
          originalName: String(candidate.originalName || candidate.fileName),
          mimeType: String(candidate.mimeType || 'application/octet-stream'),
          sizeBytes: Number(candidate.sizeBytes) || 0,
          url: `/api/uploads/${path.basename(String(candidate.fileName))}`,
          uploadedAt: String(candidate.uploadedAt || now),
        };
      }
    }

    const confirmedDocsRaw = Array.isArray(body.customerConfirmedDocuments)
      ? body.customerConfirmedDocuments.map((d: unknown) => String(d))
      : [];
    const customerConfirmedDocuments = serviceDocs.filter(
      (d) => confirmedDocsRaw.includes(d) || Boolean(uploadedDocuments[d])
    );
    const initialDocumentsChecklist: Record<string, DocumentStatus> = {};
    for (const d of serviceDocs) {
      initialDocumentsChecklist[d] = 'pending';
    }
    for (const extraDoc of EXTRA_OTHER_DOCUMENT_NAMES) {
      if (uploadedDocuments[extraDoc]) {
        initialDocumentsChecklist[extraDoc] = 'pending';
      }
    }

    const rawPayShot =
      body.paymentScreenshot && typeof body.paymentScreenshot === 'object'
        ? (body.paymentScreenshot as UploadedDocumentFile)
        : null;
    const paymentScreenshot: UploadedDocumentFile | null =
      rawPayShot && rawPayShot.url && rawPayShot.fileName
        ? {
            docName: PAYMENT_SCREENSHOT_DOC_NAME,
            fileName: path.basename(String(rawPayShot.fileName)),
            originalName: String(rawPayShot.originalName || rawPayShot.fileName),
            mimeType: String(rawPayShot.mimeType || 'image/jpeg'),
            sizeBytes: Number(rawPayShot.sizeBytes) || 0,
            url: `/api/uploads/${path.basename(String(rawPayShot.fileName))}`,
            uploadedAt: String(rawPayShot.uploadedAt || now),
          }
        : null;

    const signedCustomer = getCustomerFromReq(req, store);

    const newRequest: ServiceRequest = {
      id: `req-${crypto.randomUUID().slice(0, 8)}`,
      requestNumber,
      createdAt: now,
      updatedAt: now,
      status: 'payment_submitted',
      customerUserId: signedCustomer ? signedCustomer.id : null,
      serviceId: service.id,
      serviceName: service.name,
      serviceCategory: service.categoryTitle,
      processingSpeed,
      customerName,
      customerWhatsapp,
      customerEmail,
      customerAddress,
      customerCity,
      customerPostalCode,
      subjectTitle,
      quantity,
      preferredDate: String(body.preferredDate || now.slice(0, 10)),
      referenceCode: String(body.referenceCode || '').trim(),
      detailedInstructions,
      customDetails,
      requiredDocuments: serviceDocs,
      customerConfirmedDocuments,
      uploadedDocuments,
      documentsChecklist: initialDocumentsChecklist,
      documentsReviewNote: '',
      originalFee,
      platformCharge,
      platformChargePercent,
      expressFee,
      totalAmount,
      currencySymbol: store.settings.currencySymbol,
      paymentMethod,
      paymentReference,
      payerName,
      paymentScreenshot,
      paymentCompletedAt: now,
      paymentStatus: 'pending',
      paymentReviewNote: '',
      paymentReviewedAt: null,
      verification: {
        detailsVerified: false,
        specsVerified: false,
        paymentVerified: false,
        verificationNotes: '',
        verifiedAt: null,
        verifiedBy: null,
      },
      physicalProcessing: {
        handlerName: '',
        deskCounter: '',
        expectedCompletion: '',
        processingNotes: '',
        startedAt: null,
      },
      slip: null,
      chatMessages: [],
    };

    store.requests.unshift(newRequest);
    saveStore(store);

    res.status(201).json({ request: newRequest });
  });

  // Direct Admin <-> Customer Chat Box (Unlocked ONLY for Approved/Pending Applications, LOCKED for Rejected)
  app.get('/api/requests/:id/chat', (req, res) => {
    const store = ensureStore();
    const target = store.requests.find((r) => r.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }
    const unlocked = isChatUnlocked(target);
    res.json({
      chatUnlocked: unlocked,
      lockReason: unlocked
        ? null
        : 'Chat Box Locked — Rejected applications cannot use direct messaging.',
      messages: target.chatMessages || [],
      request: target,
    });
  });

  app.post('/api/requests/:id/chat', (req, res) => {
    const store = ensureStore();
    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }
    const target = store.requests[idx];
    if (!isChatUnlocked(target)) {
      res.status(403).json({
        error:
          'Chat is locked for rejected applications. Direct chat unlocks only for Approved or Pending applications.',
      });
      return;
    }

    const isAdmin = checkOwnerAuth(req, store);
    const signedCustomer = getCustomerFromReq(req, store);
    const body = req.body || {};
    const text = String(body.text || '').trim();
    const missedDocTargetName = String(body.missedDocTargetName || '').trim();
    const rawAttachment =
      body.attachment && typeof body.attachment === 'object'
        ? (body.attachment as UploadedDocumentFile)
        : null;

    const attachment: UploadedDocumentFile | null =
      rawAttachment && rawAttachment.url && rawAttachment.fileName
        ? {
            docName: missedDocTargetName || CHAT_ATTACHMENT_DOC_NAME,
            fileName: path.basename(String(rawAttachment.fileName)),
            originalName: String(rawAttachment.originalName || rawAttachment.fileName),
            mimeType: String(rawAttachment.mimeType || 'application/octet-stream'),
            sizeBytes: Number(rawAttachment.sizeBytes) || 0,
            url: `/api/uploads/${path.basename(String(rawAttachment.fileName))}`,
            uploadedAt: String(rawAttachment.uploadedAt || new Date().toISOString()),
          }
        : null;

    if (!text && !attachment) {
      res.status(400).json({ error: 'Please write a message or attach a missed document.' });
      return;
    }

    const now = new Date().toISOString();
    const senderRole: 'admin' | 'customer' = isAdmin ? 'admin' : 'customer';
    const senderName = isAdmin
      ? `${store.settings.ownerName} (Admin)`
      : signedCustomer?.fullName || target.customerName;
    const senderPhotoUrl = isAdmin ? null : signedCustomer?.photoUrl || null;

    const messageType: ChatMessageType = attachment ? 'missed_document' : 'message';

    // If customer attached a missed document, also link it onto the application's uploadedDocuments & checklist!
    if (attachment && missedDocTargetName) {
      target.uploadedDocuments = target.uploadedDocuments || {};
      target.uploadedDocuments[missedDocTargetName] = attachment;
      target.documentsChecklist = target.documentsChecklist || {};
      target.documentsChecklist[missedDocTargetName] = 'pending';
      if (!target.customerConfirmedDocuments.includes(missedDocTargetName)) {
        target.customerConfirmedDocuments.push(missedDocTargetName);
      }
    }

    const chatMessage: RequestChatMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      requestId: target.id,
      requestNumber: target.requestNumber,
      senderRole,
      senderName,
      senderPhotoUrl,
      messageType,
      text:
        text ||
        (missedDocTargetName
          ? `Sent missed document: ${missedDocTargetName}`
          : 'Sent supporting document'),
      attachment,
      missedDocTargetName: missedDocTargetName || undefined,
      slipSnapshot: null,
      createdAt: now,
    };

    target.chatMessages = target.chatMessages || [];
    target.chatMessages.push(chatMessage);
    target.updatedAt = now;
    saveStore(store);

    broadcastToRequestRoom(target.id, {
      type: 'chat:message',
      requestId: target.id,
      message: chatMessage,
      request: target,
      chatUnlocked: true,
    });

    res.status(201).json({
      message: chatMessage,
      request: target,
      chatUnlocked: true,
    });
  });

  app.post('/api/admin/auth', (req, res) => {
    const store = ensureStore();
    const passcode = String(req.body?.passcode || '');
    if (passcode !== store.settings.ownerPasscode) {
      res.status(401).json({ error: 'Incorrect owner passcode.' });
      return;
    }
    res.json({
      authenticated: true,
      settings: store.settings,
      services: store.services,
    });
  });

  app.get('/api/admin/requests', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }
    res.json({
      requests: [...store.requests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      settings: store.settings,
      services: store.services,
    });
  });

  app.patch('/api/admin/requests/:id/payment', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Admin passcode required.' });
      return;
    }

    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }

    const body = req.body || {};
    const decision = String(body.paymentStatus || '').toLowerCase() as PaymentDecision;
    if (decision !== 'approved' && decision !== 'pending' && decision !== 'rejected') {
      res.status(400).json({ error: 'paymentStatus must be approved, pending, or rejected.' });
      return;
    }

    const note = String(body.paymentReviewNote || '').trim();
    const now = new Date().toISOString();
    const target = store.requests[idx];

    target.paymentStatus = decision;
    target.paymentReviewNote = note;
    target.paymentReviewedAt = now;

    if (decision === 'approved') {
      target.verification = {
        ...target.verification,
        detailsVerified: true,
        specsVerified: true,
        paymentVerified: true,
        verificationNotes:
          note ||
          target.verification.verificationNotes ||
          `Payment approved for UTR ${target.paymentReference}.`,
        verifiedAt: target.verification.verifiedAt || now,
        verifiedBy: store.settings.ownerName,
      };
      if (target.status === 'payment_submitted' || target.status === 'rejected') {
        target.status = 'verified';
      }
    } else if (decision === 'pending') {
      target.verification = {
        ...target.verification,
        paymentVerified: false,
        verificationNotes: note || target.verification.verificationNotes,
      };
      if (target.status !== 'slip_issued') {
        target.status = 'payment_submitted';
      }
    } else if (decision === 'rejected') {
      target.verification = {
        ...target.verification,
        paymentVerified: false,
        verificationNotes: note || 'Payment / application rejected during Admin inspection.',
      };
      target.status = 'rejected';
    }

    target.updatedAt = now;
    saveStore(store);
    broadcastToRequestRoom(target.id, {
      type: 'request:updated',
      requestId: target.id,
      request: target,
      chatUnlocked: isChatUnlocked(target),
    });
    res.json({ request: target });
  });

  app.patch('/api/admin/requests/:id/documents', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Admin passcode required.' });
      return;
    }

    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }

    const target = store.requests[idx];
    const body = req.body || {};
    const rawChecklist =
      body.documentsChecklist && typeof body.documentsChecklist === 'object'
        ? body.documentsChecklist
        : {};
    const nextChecklist: Record<string, DocumentStatus> = { ...target.documentsChecklist };

    const checklistDocNames = Array.from(
      new Set([
        ...(target.requiredDocuments || []),
        ...Object.keys(target.uploadedDocuments || {}),
      ])
    );
    for (const docName of checklistDocNames) {
      const val = rawChecklist[docName];
      if (val === 'verified' || val === 'missing' || val === 'pending') {
        nextChecklist[docName] = val;
      } else if (!nextChecklist[docName]) {
        nextChecklist[docName] = 'pending';
      }
    }

    target.documentsChecklist = nextChecklist;
    target.documentsReviewNote = String(body.documentsReviewNote || '').trim();
    target.updatedAt = new Date().toISOString();

    saveStore(store);
    broadcastToRequestRoom(target.id, {
      type: 'request:updated',
      requestId: target.id,
      request: target,
      chatUnlocked: isChatUnlocked(target),
    });
    res.json({ request: target });
  });

  app.patch('/api/admin/requests/:id/verify', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }

    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }

    const body = req.body || {};
    const detailsVerified = Boolean(body.detailsVerified);
    const specsVerified = Boolean(body.specsVerified);
    const paymentVerified = Boolean(body.paymentVerified);

    if (!detailsVerified || !specsVerified || !paymentVerified) {
      res.status(400).json({ error: 'All three verification checks must be confirmed before approving.' });
      return;
    }

    const now = new Date().toISOString();
    const target = store.requests[idx];
    target.verification = {
      detailsVerified: true,
      specsVerified: true,
      paymentVerified: true,
      verificationNotes: String(body.verificationNotes || 'All customer details, service boxes, and fee + 20% platform charge verified.'),
      verifiedAt: now,
      verifiedBy: store.settings.ownerName,
    };
    target.paymentStatus = 'approved';
    target.paymentReviewedAt = target.paymentReviewedAt || now;
    if (target.status === 'payment_submitted' || target.status === 'rejected') {
      target.status = 'verified';
    }
    target.updatedAt = now;

    saveStore(store);
    broadcastToRequestRoom(target.id, {
      type: 'request:updated',
      requestId: target.id,
      request: target,
      chatUnlocked: isChatUnlocked(target),
    });
    res.json({ request: target });
  });

  app.patch('/api/admin/requests/:id/process', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }

    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }

    const target = store.requests[idx];
    const body = req.body || {};
    const now = new Date().toISOString();

    if (!target.verification.paymentVerified) {
      target.verification = {
        detailsVerified: true,
        specsVerified: true,
        paymentVerified: true,
        verificationNotes: target.verification.verificationNotes || 'Verified prior to physical processing.',
        verifiedAt: now,
        verifiedBy: store.settings.ownerName,
      };
    }

    target.physicalProcessing = {
      handlerName: String(body.handlerName || store.settings.ownerName).trim(),
      deskCounter: String(body.deskCounter || 'Main CSC Counter').trim(),
      expectedCompletion: String(body.expectedCompletion || now.slice(0, 10)).trim(),
      processingNotes: String(body.processingNotes || 'Physical processing initiated.').trim(),
      startedAt: target.physicalProcessing.startedAt || now,
    };
    if (target.status !== 'slip_issued') {
      target.status = 'processing_physically';
    }
    target.updatedAt = now;

    saveStore(store);
    broadcastToRequestRoom(target.id, {
      type: 'request:updated',
      requestId: target.id,
      request: target,
      chatUnlocked: isChatUnlocked(target),
    });
    res.json({ request: target });
  });

  app.post('/api/admin/requests/:id/slip', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }

    const idx = store.requests.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service request not found.' });
      return;
    }

    const target = store.requests[idx];
    const body = req.body || {};
    const now = new Date().toISOString();

    if (!target.verification.paymentVerified) {
      target.verification = {
        detailsVerified: true,
        specsVerified: true,
        paymentVerified: true,
        verificationNotes: 'Verified and approved for slip issuance.',
        verifiedAt: now,
        verifiedBy: store.settings.ownerName,
      };
    }

    if (!target.physicalProcessing.startedAt) {
      target.physicalProcessing = {
        handlerName: String(body.handlerName || store.settings.ownerName).trim(),
        deskCounter: String(body.deskCounter || 'Main CSC Counter').trim(),
        expectedCompletion: now.slice(0, 10),
        processingNotes: String(body.processingNotes || 'Physically processed and quality checked.').trim(),
        startedAt: now,
      };
    }

    if (!target.slip) {
      store.slipCounter += 1;
      const year = new Date().getFullYear();
      const digest = crypto
        .createHash('sha256')
        .update(`${target.requestNumber}:${target.paymentReference}:${now}`)
        .digest('hex')
        .slice(0, 8)
        .toUpperCase();

      target.slip = {
        slipNumber: `SLP-${year}-${store.slipCounter}`,
        issuedAt: now,
        verificationCode: `VRF-${digest.slice(0, 4)}-${digest.slice(4, 8)}`,
        finalRemarks: String(
          body.finalRemarks ||
            'All submitted details and fee payment verified. Physical processing completed and official slip issued.'
        ).trim(),
        issuedBy: store.settings.ownerName,
      };
    } else if (body.finalRemarks) {
      target.slip.finalRemarks = String(body.finalRemarks).trim();
    }

    target.status = 'slip_issued';
    target.updatedAt = now;

    // If transferInChat or slip generated while chat is unlocked, transfer Official Slip directly into Customer Chat!
    let slipChatMessage: RequestChatMessage | null = null;
    if (isChatUnlocked(target) && (body.transferInChat === true || !target.chatMessages?.some((m) => m.messageType === 'slip_transfer'))) {
      slipChatMessage = {
        id: `msg-${crypto.randomUUID().slice(0, 8)}`,
        requestId: target.id,
        requestNumber: target.requestNumber,
        senderRole: 'admin',
        senderName: `${store.settings.ownerName} (Admin)`,
        senderPhotoUrl: null,
        messageType: 'slip_transfer',
        text: `All done! Your Official Processing Slip (${target.slip.slipNumber}) has been generated and transferred to you. You can view and print your Official Slip now.`,
        attachment: null,
        slipSnapshot: target.slip,
        createdAt: now,
      };
      target.chatMessages = target.chatMessages || [];
      target.chatMessages.push(slipChatMessage);
    }

    saveStore(store);

    if (slipChatMessage) {
      broadcastToRequestRoom(target.id, {
        type: 'chat:message',
        requestId: target.id,
        message: slipChatMessage,
        request: target,
        chatUnlocked: true,
      });
    } else {
      broadcastToRequestRoom(target.id, {
        type: 'request:updated',
        requestId: target.id,
        request: target,
        chatUnlocked: isChatUnlocked(target),
      });
    }

    res.json({ request: target, slipChatMessage });
  });

  app.patch('/api/admin/settings', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }

    const body = req.body || {};
    if (body.settings) {
      const s = body.settings;
      store.settings = {
        businessName: String(s.businessName || store.settings.businessName).trim(),
        ownerName: String(s.ownerName || store.settings.ownerName).trim(),
        ownerWhatsapp: sanitizePhone(String(s.ownerWhatsapp || store.settings.ownerWhatsapp)),
        supportEmail: String(s.supportEmail || store.settings.supportEmail).trim(),
        officeAddress: String(s.officeAddress || store.settings.officeAddress).trim(),
        currencySymbol: String(s.currencySymbol || store.settings.currencySymbol).trim() || '₹',
        platformChargePercent: Math.max(0, Math.min(100, Number(s.platformChargePercent ?? store.settings.platformChargePercent))),
        upiId: String(s.upiId || store.settings.upiId).trim(),
        upiPayeeName: String(s.upiPayeeName || store.settings.upiPayeeName).trim(),
        bankDetails: String(s.bankDetails || store.settings.bankDetails).trim(),
        ownerPasscode: String(s.ownerPasscode || store.settings.ownerPasscode).trim() || 'Ashraful786$',
      };
    }

    if (Array.isArray(body.services)) {
      store.services = body.services.map((srv: ServicePackage) => ({
        ...srv,
        id: String(srv.id || `srv-${crypto.randomUUID().slice(0, 6)}`),
        name: String(srv.name || 'Custom Service').trim(),
        nameHi: String(srv.nameHi || srv.name || 'Custom Service').trim(),
        categoryTitle: String(srv.categoryTitle || 'Business & Travel').trim(),
        categoryTitleHi: String(srv.categoryTitleHi || '').trim(),
        description: String(srv.description || '').trim(),
        originalFee: Math.max(0, Number(srv.originalFee) || 0),
        expressAddonFee: Math.max(0, Number(srv.expressAddonFee) || 0),
        turnaroundStandard: String(srv.turnaroundStandard || '2-3 Days').trim(),
        turnaroundExpress: String(srv.turnaroundExpress || 'Same Day').trim(),
        requiredHints: Array.isArray(srv.requiredHints) ? srv.requiredHints.map(String) : [],
        requiredDocuments: Array.isArray(srv.requiredDocuments)
          ? srv.requiredDocuments.map((d) => String(d).trim()).filter(Boolean)
          : [],
        customFields: Array.isArray(srv.customFields) ? srv.customFields : [],
        active: Boolean(srv.active),
      }));
    }

    saveStore(store);
    res.json({
      settings: store.settings,
      services: store.services,
    });
  });

  app.delete('/api/admin/requests/:id', (req, res) => {
    const store = ensureStore();
    if (!checkOwnerAuth(req, store)) {
      res.status(401).json({ error: 'Owner passcode required.' });
      return;
    }
    store.requests = store.requests.filter((r) => r.id !== req.params.id);
    saveStore(store);
    res.json({ deleted: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`JanSeva SlipCraft Desk server listening on http://0.0.0.0:${port}`);
  });
}

startServer();

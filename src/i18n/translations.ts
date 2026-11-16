import type { ServiceCategoryKey, ServicePackage } from '../types';

export type AppLanguage = 'en' | 'hi' | 'bn';

export const WHATSAPP_SUPPORT_DISPLAY = '+91 9520951867';
export const WHATSAPP_SUPPORT_DIGITS = '919520951867';
export const WHATSAPP_SUPPORT_URL = `https://wa.me/${WHATSAPP_SUPPORT_DIGITS}?text=${encodeURIComponent(
  'Hello Mr Ashraf Banking Traveling Communication, I need assistance with a service request.'
)}`;

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

export interface UiStrings {
  nav: {
    services: string;
    fillDetails: string;
    paymentGateway: string;
    trackSlip: string;
    adminPlatform: string;
    startRequest: string;
    backToPortal: string;
  };
  supportBar: {
    label: string;
    chatBtn: string;
    callBtn: string;
    languageLabel: string;
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    startCta: string;
    trackCta: string;
    steps: { title: string; desc: string }[];
  };
  catalog: {
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    allCategories: string;
    servicesAvailable: string;
    requiredLabel: string;
    originalLabel: string;
    chargeLabel: string;
    totalLabel: string;
    applyBtn: string;
    noMatchTitle: string;
    noMatchDesc: string;
    clearFilters: string;
    docsSectionTitle: string;
    docsSectionNotePrefix: string;
    docsSectionDesc: string;
    proofHeading: string;
    proofKicker: string;
    proofDesc: string;
    statActiveServices: string;
    statPlatformCharge: string;
    statSlipsIssued: string;
    sampleSlipBtn: string;
  };
  wizard: {
    pageTitle: string;
    pageDescPrefix: string;
    stepLabels: string[];
    step1Title: string;
    step1Sub: string;
    processingSpeedLabel: string;
    standardDesk: string;
    included: string;
    expressPriority: string;
    readyIn: string;
    step1Next: string;
    step2Title: string;
    selectedServiceLabel: string;
    fullNameLabel: string;
    mobileLabel: string;
    emailLabel: string;
    addressLabel: string;
    cityLabel: string;
    pinLabel: string;
    changeServiceBtn: string;
    step2Next: string;
    step3TitlePrefix: string;
    step3Sub: string;
    serviceBoxesHeading: string;
    subjectLabel: string;
    quantityLabel: string;
    preferredDateLabel: string;
    oldRefLabel: string;
    notesLabel: string;
    docsHeading: string;
    docsNoteStrong: string;
    docsNoteRest: string;
    docsExtraTitle: string;
    docsExtraSub: string;
    extraDocNamePlaceholder: string;
    uploadFileBtn: string;
    uploadExtraBtn: string;
    uploadingBtn: string;
    viewBtn: string;
    removeBtn: string;
    readyAtCounterLabel: string;
    backBtn: string;
    step3Next: string;
    step4Title: string;
    step4Sub: string;
    origFeeRow: string;
    platformRow: string;
    expressRow: string;
    totalPayableNow: string;
    payMethodUpi: string;
    payMethodBank: string;
    payMethodCard: string;
    officialQrHeading: string;
    scanQrInstruction: string;
    copyUpi: string;
    copiedUpi: string;
    payeeLabel: string;
    exactAmountLabel: string;
    openUpiApp: string;
    utrLabel: string;
    payerNameLabel: string;
    paymentScreenshotTitle: string;
    paymentScreenshotSub: string;
    paymentScreenshotUploadBtn: string;
    paymentScreenshotAttached: string;
    paymentScreenshotNone: string;
    confirmPayCheckbox: string;
    submittingBtn: string;
    submitPayBtn: string;
    step5Title: string;
    step5Desc: string;
    trackDownloadBtn: string;
    copyIdBtn: string;
    copiedIdBtn: string;
    submitAnotherBtn: string;
    liveFeeSummary: string;
    requiredDocsSummary: string;
  };
  track: {
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    searchBtn: string;
    searchingBtn: string;
    recentLabel: string;
    noMatchTitle: string;
    noMatchDesc: string;
    docsStatusTitle: string;
    verifiedLabel: string;
    pendingLabel: string;
    missingLabel: string;
  };
  topServices: {
    title: string;
    subtitle: string;
    scanPayAction: string;
    trackSlipAction: string;
    copyUpiAction: string;
    copiedUpiAction: string;
    browseAllBtn: string;
    countSummary: string;
  };
  footer: {
    helplineLabel: string;
    whatsappSupport: string;
  };
  scrolling: {
    stage1Label: string;
    stage2Label: string;
    stage3Label: string;
    stage4Label: string;
    window1Badge: string;
    window2Badge: string;
    window2Title: string;
    window2Sub: string;
    window2SubPersonal: string;
    window2SubService: string;
    window3Badge: string;
    window3Title: string;
    window3Sub: string;
    window4Badge: string;
    window4Title: string;
    window4Sub: string;
    activeWindowTag: string;
    selectedServiceBanner: string;
    continueToPersonalBtn: string;
    continueToServiceBoxesBtn: string;
    continueToPaymentBtn: string;
    backToServiceTypeBtn: string;
    backToPersonalBtn: string;
    submitToSlipBtn: string;
    justSubmittedTitle: string;
    justSubmittedDesc: string;
  };
  auth: {
    loginRegisterBtn: string;
    myProfileBtn: string;
    modalTitleSignIn: string;
    modalTitleSignUp: string;
    modalTitleProfile: string;
    tabSignIn: string;
    tabSignUp: string;
    tabProfile: string;
    providerLabel: string;
    providerPhone: string;
    providerGmail: string;
    providerFacebook: string;
    identifierPhoneLabel: string;
    identifierGmailLabel: string;
    identifierFacebookLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    phoneOptionalLabel: string;
    emailOptionalLabel: string;
    facebookOptionalLabel: string;
    profilePhotoLabel: string;
    profilePhotoRule: string;
    uploadPhotoBtn: string;
    changePhotoBtn: string;
    removePhotoBtn: string;
    additionalDetailsTitle: string;
    dobLabel: string;
    genderLabel: string;
    guardianLabel: string;
    addressLabel: string;
    cityLabel: string;
    pinLabel: string;
    bioNotesLabel: string;
    termsHeading: string;
    termsRequiredBadge: string;
    termsClauses: string[];
    termsAcceptCheckbox: string;
    submitSignInBtn: string;
    submitSignUpBtn: string;
    saveProfileBtn: string;
    savingBtn: string;
    signOutBtn: string;
    signedInAsLabel: string;
    myAppsTitle: string;
    myAppsEmpty: string;
    openInTrackChatBtn: string;
    chatUnlockedPill: string;
    chatLockedPill: string;
    applyWithProfileNote: string;
  };
  chat: {
    boxTitle: string;
    unlockedApprovedBadge: string;
    unlockedPendingBadge: string;
    lockedRejectedBadge: string;
    lockedTitle: string;
    lockedDesc: string;
    unlockedSub: string;
    emptyChatText: string;
    messagePlaceholder: string;
    sendBtn: string;
    sendingBtn: string;
    missedDocTitle: string;
    missedDocSelectLabel: string;
    missedDocGeneralOption: string;
    attachDocBtn: string;
    uploadingDocBtn: string;
    slipTransferredTitle: string;
    slipNumberLabel: string;
    viewPrintSlipBtn: string;
    adminAllDoneBtn: string;
    adminAllDoneSub: string;
    liveBadge: string;
  };
}

export const UI_STRINGS: Record<AppLanguage, UiStrings> = {
  en: {
    nav: {
      services: 'Service Type',
      fillDetails: 'Personal Details',
      paymentGateway: 'Payment Gateway',
      trackSlip: 'Slip / Track',
      adminPlatform: 'Admin Platform',
      startRequest: 'Start Request',
      backToPortal: 'Back to Customer Portal',
    },
    supportBar: {
      label: 'WhatsApp Support',
      chatBtn: 'Chat on WhatsApp',
      callBtn: 'Call',
      languageLabel: 'Language',
    },
    hero: {
      kicker: 'Citizen Desk · Banking & Travel · Official Slip',
      title: 'Fill Every Detail Step by Step. Pay & Receive Your Official Slip.',
      subtitle:
        'Select your service from Identity, Banking, Government Schemes, Education, or Travel. Complete each box one by one, upload only required documents, pay Original Fee + Platform Service Charge via QR/UPI, and receive your verified Official Processing Slip.',
      startCta: 'Start Service Request',
      trackCta: 'Track & Print Slip',
      steps: [
        {
          title: '01. Select & Fill Boxes',
          desc: 'Pick your category box and fill every service detail field one by one.',
        },
        {
          title: '02. Upload & Pay Fee',
          desc: 'Upload only required docs + transparent 20% Platform Charge via QR/UPI.',
        },
        {
          title: '03. Admin Verification',
          desc: 'All entered box details & payment UTR are verified directly on our Admin Platform.',
        },
        {
          title: '04. Physical Work & Slip',
          desc: 'Mr. Ashraf processes your application physically and publishes your official slip.',
        },
      ],
    },
    catalog: {
      heading: 'All Services — Carefully Arranged by Category',
      subheading:
        'Search or pick a category box below to open its step-by-step form. Every service clearly shows Original Fee + Platform Service Charge.',
      searchPlaceholder: 'Search services (e.g. Aadhaar, PAN, PM Kisan, IRCTC, Birth, Scholarship)...',
      allCategories: 'All 5 Categories',
      servicesAvailable: 'Services Available',
      requiredLabel: 'Required',
      originalLabel: 'Orig',
      chargeLabel: 'Charge',
      totalLabel: 'Total',
      applyBtn: 'Fill Details & Apply',
      noMatchTitle: 'No matching service found',
      noMatchDesc: 'Try a different keyword or switch back to All 5 Categories.',
      clearFilters: 'Show All Services',
      docsSectionTitle: 'Portal Supporting Documents & Upload Rules',
      docsSectionNotePrefix: 'Note: Only Upload Your Service Required Documents.',
      docsSectionDesc:
        'Each service asks ONLY for the required documents listed on that service card (plus 2 optional Extra Boxes for Other Document) in JPG, JPEG, PNG, or PDF format — Photos & Signature size up to 1 MB.',
      proofKicker: 'Checked Properly · Processed Physically',
      proofHeading: 'Every Submission Is Verified Before Physical Processing & Slip Issuance',
      proofDesc:
        'Once you submit your details and fee UTR through our portal, every box is checked on the Admin Platform, payment is verified, your application is processed physically, and your Official Processing Slip is issued for instant viewing and PDF printing.',
      statActiveServices: 'Active Services',
      statPlatformCharge: 'Platform Charge',
      statSlipsIssued: 'Slips Issued',
      sampleSlipBtn: 'View Sample Issued Slip',
    },
    wizard: {
      pageTitle: 'Step-by-Step Service Form & Fee Payment',
      pageDescPrefix: 'Choose your service category box, fill every required detail box one by one, pay Original Fee +',
      stepLabels: [
        'Category & Service',
        'Customer Details',
        'Service Form & Docs',
        'Fee + 20% Charge',
        'Submitted & Track',
      ],
      step1Title: '01. Select Service From Category Box',
      step1Sub: 'Every service shows its Original Fee + Platform Service Charge clearly.',
      processingSpeedLabel: 'Processing Speed',
      standardDesk: 'Standard Desk',
      included: 'Included',
      expressPriority: 'Express Priority',
      readyIn: 'Ready in',
      step1Next: 'Step 2: Fill Customer Details',
      step2Title: '02. Applicant / Customer Details (One by One)',
      selectedServiceLabel: 'Selected Service:',
      fullNameLabel: 'Applicant Full Name',
      mobileLabel: 'Customer Mobile Number (with 91)',
      emailLabel: 'Email Address (optional)',
      addressLabel: 'Village / House No. / Street Address',
      cityLabel: 'District / City',
      pinLabel: 'PIN Code',
      changeServiceBtn: 'Change Service',
      step2Next: 'Step 3: Fill Service Boxes',
      step3TitlePrefix: '03. Fill Required Boxes —',
      step3Sub:
        'Fill every box carefully one by one. All these details will be submitted directly to our Admin Platform for verification.',
      serviceBoxesHeading: 'Service-Specific Detail Boxes',
      subjectLabel: 'Application Subject / Short Summary',
      quantityLabel: 'Applicant / Form Quantity',
      preferredDateLabel: 'Preferred Counter Processing Date',
      oldRefLabel: 'Old Acknowledgement / Reference Number (if any)',
      notesLabel: 'Extra Remarks / Physical Handover Notes',
      docsHeading: 'Documents Upload — Required Supporting Documents',
      docsNoteStrong: 'Note: Only Upload Your Service Required Documents.',
      docsNoteRest:
        'Accepted formats: JPG, JPEG, PNG, or PDF (Applicant Photo & Signature max 1 MB; supporting proofs max 2 MB).',
      docsExtraTitle: 'Other Document — 2 Extra Upload Boxes (Optional)',
      docsExtraSub:
        'Need to attach any extra supporting document? Upload up to 2 additional files below (JPG, JPEG, PNG, PDF · Max 2 MB each).',
      extraDocNamePlaceholder: 'Optional: Write document name (e.g. Affidavit, Old Receipt, Annexure)',
      uploadFileBtn: 'Upload File',
      uploadExtraBtn: 'Upload Extra File',
      uploadingBtn: 'Uploading...',
      viewBtn: 'View',
      removeBtn: 'Remove',
      readyAtCounterLabel: 'I have this document ready (or will submit at physical counter)',
      backBtn: 'Back',
      step3Next: 'Step 4: Review & Pay Fees',
      step4Title: '04. Complete Payment (Original Fee + Platform Charge)',
      step4Sub:
        'Review your fee breakdown below, complete payment, and enter your Transaction ID / UTR reference number to submit your application.',
      origFeeRow: 'Original Service Fee',
      platformRow: 'Platform Service Charge',
      expressRow: 'Express Priority Processing',
      totalPayableNow: 'Total Payable Now',
      payMethodUpi: 'UPI / QR',
      payMethodBank: 'Bank Transfer',
      payMethodCard: 'Card / Online',
      officialQrHeading: 'Official Merchant UPI & Scan-to-Pay QR',
      scanQrInstruction:
        'Scan the QR code using Google Pay, PhonePe, Paytm, or BHIM UPI, or pay directly to the UPI ID below:',
      copyUpi: 'Copy UPI ID',
      copiedUpi: 'Copied UPI',
      payeeLabel: 'Payee:',
      exactAmountLabel: 'Exact Payable Amount:',
      openUpiApp: 'Open in UPI App',
      utrLabel: 'Transaction ID / UTR / Payment Reference',
      payerNameLabel: 'Account Holder / Payer Name',
      paymentScreenshotTitle: 'UPI / Payment Transaction Screenshot (Recommended)',
      paymentScreenshotSub:
        'Attach a screenshot or receipt of your successful UPI / GPay / PhonePe / Paytm payment (JPG, JPEG, PNG, PDF · Max 2 MB) for faster Admin verification.',
      paymentScreenshotUploadBtn: 'Upload Payment Screenshot',
      paymentScreenshotAttached: 'Payment Screenshot Attached',
      paymentScreenshotNone: 'No screenshot attached',
      confirmPayCheckbox: 'I confirm that I have completed the fee payment above and all filled box details are correct.',
      submittingBtn: 'Submitting Application...',
      submitPayBtn: 'Complete Payment & Submit Application',
      step5Title: 'Application & Fee Payment Submitted to Admin Platform',
      step5Desc:
        'All your details and payment reference have been received. Once verified and processed physically, your Official Slip will appear in Track & Slip.',
      trackDownloadBtn: 'Track Status & Download Slip',
      copyIdBtn: 'Copy ID',
      copiedIdBtn: 'Request ID Copied',
      submitAnotherBtn: 'Submit Another Service Request',
      liveFeeSummary: 'Live Fee Breakdown',
      requiredDocsSummary: 'Required Documents',
    },
    track: {
      heading: 'Track Request & Download Official Slip',
      subheading:
        'Enter your Request ID (e.g. SRV-2026-1001) or Mobile number to check live payment approval, Required Documents status, physical processing, and Official Slip.',
      searchPlaceholder: 'Enter Request ID (SRV-2026-...) or 10-digit Mobile number',
      searchBtn: 'Check Status',
      searchingBtn: 'Checking...',
      recentLabel: 'Recent Requests:',
      noMatchTitle: 'No Matching Request Found',
      noMatchDesc: 'Double check your Request ID or try searching with the last 8 digits of your Mobile number.',
      docsStatusTitle: 'Required Documents Status',
      verifiedLabel: 'Verified',
      pendingLabel: 'Pending Check',
      missingLabel: 'Missing / Required',
    },
    topServices: {
      title: 'Top 10 Most Used Services',
      subtitle: 'Tap any service icon to fill details, upload docs & pay fee',
      scanPayAction: 'Scan QR & Pay',
      trackSlipAction: 'Check Slip',
      copyUpiAction: 'Copy UPI',
      copiedUpiAction: 'Copied UPI',
      browseAllBtn: 'Browse All 21 Services',
      countSummary: 'Top 10 Quick Services · All 21 Services Listed Below',
    },
    footer: {
      helplineLabel: 'Helpline',
      whatsappSupport: 'WhatsApp Support',
    },
    scrolling: {
      stage1Label: 'Service Type',
      stage2Label: 'Personal Details',
      stage3Label: 'Payment Gateway',
      stage4Label: 'Slip / Tracking',
      window1Badge: 'Window 01 · Service Type Selection',
      window2Badge: 'Window 02 · Personal & Service Details',
      window2Title: 'Personal Details & Service-Specific Form',
      window2Sub:
        'Fields and Required Supporting Documents automatically adapt to your selected Service Type.',
      window2SubPersonal: '2A. Customer Personal Details',
      window2SubService: '2B. Service Type Boxes & Required Documents',
      window3Badge: 'Window 03 · Payment Gateway',
      window3Title: 'Payment Gateway (Original Fee + Platform Charge)',
      window3Sub:
        'Scan Merchant QR or pay via UPI / Bank / Card, enter Transaction ID / UTR, attach screenshot, and confirm.',
      window4Badge: 'Window 04 · Slip / Tracking Record',
      window4Title: 'Official Slip & Live Tracking Record',
      window4Sub:
        'View your newly generated request slip, check document verification progress, or track any previous Request ID.',
      activeWindowTag: 'Active Window',
      selectedServiceBanner: 'Active Service Type:',
      continueToPersonalBtn: 'Next: Personal & Service Details',
      continueToServiceBoxesBtn: 'Next: Service Boxes & Required Docs',
      continueToPaymentBtn: 'Next: Payment Gateway',
      backToServiceTypeBtn: 'Change Service Type',
      backToPersonalBtn: 'Back to Personal Details',
      submitToSlipBtn: 'Complete Payment & Open Slip Record',
      justSubmittedTitle: 'Payment Submitted · Slip & Tracking Record Ready',
      justSubmittedDesc:
        'Your details and payment proof are saved. Track live verification and print your Official Slip below.',
    },
    auth: {
      loginRegisterBtn: 'Sign In / Sign Up',
      myProfileBtn: 'My Profile',
      modalTitleSignIn: 'Customer Sign In (Phone / Gmail / Facebook)',
      modalTitleSignUp: 'Create Customer Account & Profile',
      modalTitleProfile: 'Customer Profile & My Applications',
      tabSignIn: 'Sign In',
      tabSignUp: 'Sign Up (New User)',
      tabProfile: 'My Profile & Apps',
      providerLabel: 'Choose Login Method',
      providerPhone: 'Phone Number',
      providerGmail: 'Gmail',
      providerFacebook: 'Facebook',
      identifierPhoneLabel: 'Registered Mobile Number (with 91)',
      identifierGmailLabel: 'Gmail / Email Address',
      identifierFacebookLabel: 'Facebook ID / Profile Username or Email',
      passwordLabel: 'Account Password (min 4 characters)',
      fullNameLabel: 'Applicant Full Name',
      phoneOptionalLabel: 'Mobile Number (with 91)',
      emailOptionalLabel: 'Gmail / Email Address',
      facebookOptionalLabel: 'Facebook Profile / ID (optional)',
      profilePhotoLabel: 'Profile Photo (Optional)',
      profilePhotoRule: 'JPG / JPEG / PNG · Max 1 MB',
      uploadPhotoBtn: 'Upload Photo',
      changePhotoBtn: 'Change Photo',
      removePhotoBtn: 'Remove',
      additionalDetailsTitle: 'Additional Profile Details (Auto-fills Future Forms)',
      dobLabel: 'Date of Birth',
      genderLabel: 'Gender',
      guardianLabel: 'Father / Mother / Guardian Name',
      addressLabel: 'Village / House No. / Street Address',
      cityLabel: 'District / City',
      pinLabel: 'PIN Code',
      bioNotesLabel: 'Additional Notes / Service Preferences',
      termsHeading: 'Mandatory Terms & Conditions (Required for Account & Service Usage)',
      termsRequiredBadge: 'Required',
      termsClauses: [
        '1. Accurate Details & Original Documents: You confirm that all personal details, service box entries, and supporting documents uploaded (including Missed Documents sent via Chat) belong truthfully to you and match original records.',
        '2. Fee Transparency & Verification: Every service fee consists of the Original Fee + transparent Platform Service Charge. Applications are processed physically only after Admin UTR & document verification.',
        '3. Direct Admin Chat Policy: Direct Admin-to-Customer Chat unlocks ONLY for Approved or Pending applications to discuss service details, send missed documents, and deliver Official Slips. Rejected applications remain locked from direct chat.',
        '4. Data Privacy & Helpline Support: Uploaded proofs and profile photos are used solely for official counter filing and slip generation. Support helpline: WhatsApp +91 9520951867.',
      ],
      termsAcceptCheckbox:
        'I have read and agree to the Terms & Conditions above for using Mr Ashraf Banking Traveling Communication.',
      submitSignInBtn: 'Sign In to Portal',
      submitSignUpBtn: 'Accept Terms & Create Account',
      saveProfileBtn: 'Save Profile Changes',
      savingBtn: 'Saving...',
      signOutBtn: 'Sign Out',
      signedInAsLabel: 'Signed in via',
      myAppsTitle: 'My Submitted Applications & Chat Access',
      myAppsEmpty: 'No submitted applications linked to your profile yet.',
      openInTrackChatBtn: 'Open Slip & Chat',
      chatUnlockedPill: 'Chat Unlocked',
      chatLockedPill: 'Rejected · Chat Locked',
      applyWithProfileNote: 'Profile auto-fills your customer details below.',
    },
    chat: {
      boxTitle: 'Direct Admin ↔ Customer Support Chat Box',
      unlockedApprovedBadge: 'Approved · Chat Unlocked',
      unlockedPendingBadge: 'Pending · Chat Unlocked',
      lockedRejectedBadge: 'Rejected · Chat Locked',
      lockedTitle: 'Chat Box Locked — Application Rejected',
      lockedDesc:
        'This application or payment was marked Rejected during Admin inspection. Direct Admin-to-Customer chat, missed document uploads, and slip transfer unlock only for Approved or Pending applications.',
      unlockedSub:
        'Discuss more service details directly with Mr. Ashraf, upload any missed supporting documents, and receive your Official Processing Slip here once done.',
      emptyChatText: 'No messages yet. Ask about your service details or send a missed document below.',
      messagePlaceholder: 'Type a message about service details or document query...',
      sendBtn: 'Send Message',
      sendingBtn: 'Sending...',
      missedDocTitle: 'Send Missed / Extra Supporting Document',
      missedDocSelectLabel: 'Document Slot',
      missedDocGeneralOption: 'General / Missed Supporting Document',
      attachDocBtn: 'Attach & Send Document',
      uploadingDocBtn: 'Uploading...',
      slipTransferredTitle: 'All Done · Official Processing Slip Transferred',
      slipNumberLabel: 'Slip No.',
      viewPrintSlipBtn: 'View & Print Official Slip',
      adminAllDoneBtn: 'All Done · Generate & Transfer Slip',
      adminAllDoneSub: 'Issues official slip & sends it directly in customer chat',
      liveBadge: 'Live Room',
    },
  },
  hi: {
    nav: {
      services: 'सेवा प्रकार',
      fillDetails: 'व्यक्तिगत विवरण',
      paymentGateway: 'पेमेंट गेटवे',
      trackSlip: 'स्लिप / ट्रैक',
      adminPlatform: 'एडमिन प्लेटफॉर्म',
      startRequest: 'आवेदन शुरू करें',
      backToPortal: 'ग्राहक पोर्टल पर वापस जाएं',
    },
    supportBar: {
      label: 'व्हाट्सएप सहायता',
      chatBtn: 'व्हाट्सएप पर चैट करें',
      callBtn: 'कॉल',
      languageLabel: 'भाषा',
    },
    hero: {
      kicker: 'नागरिक सेवा केंद्र · बैंकिंग और यात्रा · आधिकारिक रसीद',
      title: 'हर विवरण एक-एक करके भरें। शुल्क भुगतान करें और आधिकारिक स्लिप प्राप्त करें।',
      subtitle:
        'पहचान, बैंकिंग, सरकारी योजनाएं, शिक्षा या यात्रा श्रेणी में से अपनी सेवा चुनें। सभी बॉक्स एक-एक करके भरें, केवल आवश्यक दस्तावेज़ अपलोड करें, मूल शुल्क + प्लेटफॉर्म सेवा शुल्क का QR/UPI भुगतान करें और अपनी सत्यापित आधिकारिक स्लिप प्राप्त करें।',
      startCta: 'सेवा आवेदन शुरू करें',
      trackCta: 'स्थिति और स्लिप देखें',
      steps: [
        {
          title: '01. सेवा चुनें व बॉक्स भरें',
          desc: 'अपनी श्रेणी चुनें और सेवा के सभी आवश्यक बॉक्स एक-एक करके भरें।',
        },
        {
          title: '02. दस्तावेज़ व शुल्क भुगतान',
          desc: 'केवल आवश्यक दस्तावेज़ अपलोड करें और QR/UPI द्वारा मूल शुल्क + 20% चार्ज भरें।',
        },
        {
          title: '03. एडमिन सत्यापन',
          desc: 'आपके सभी विवरण और भुगतान UTR सीधे हमारे एडमिन प्लेटफॉर्म पर जांचे जाते हैं।',
        },
        {
          title: '04. भौतिक कार्य और स्लिप',
          desc: 'श्री अशरफ द्वारा भौतिक प्रक्रिया पूरी कर आपकी आधिकारिक स्लिप जारी की जाती है।',
        },
      ],
    },
    catalog: {
      heading: 'सभी सेवाएं — श्रेणी के अनुसार व्यवस्थित',
      subheading:
        'स्टेप-बाय-स्टेप फॉर्म खोलने के लिए नीचे खोजें या श्रेणी बॉक्स चुनें। हर सेवा में मूल शुल्क + प्लेटफॉर्म सेवा शुल्क स्पष्ट दिखाया गया है।',
      searchPlaceholder: 'सेवा खोजें (जैसे आधार, पैन, पीएम किसान, IRCTC, जन्म, छात्रवृत्ति)...',
      allCategories: 'सभी 5 श्रेणियां',
      servicesAvailable: 'उपलब्ध सेवाएं',
      requiredLabel: 'आवश्यक दस्तावेज़',
      originalLabel: 'मूल शुल्क',
      chargeLabel: 'चार्ज',
      totalLabel: 'कुल',
      applyBtn: 'विवरण भरें और आवेदन करें',
      noMatchTitle: 'कोई मिलती-जुलती सेवा नहीं मिली',
      noMatchDesc: 'कोई दूसरा शब्द लिखकर खोजें या सभी 5 श्रेणियां चुनें।',
      clearFilters: 'सभी सेवाएं दिखाएं',
      docsSectionTitle: 'पोर्टल सहायक दस्तावेज़ और अपलोड नियम',
      docsSectionNotePrefix: 'नोट: केवल अपनी चुनी हुई सेवा के आवश्यक दस्तावेज़ ही अपलोड करें।',
      docsSectionDesc:
        'प्रत्येक सेवा में केवल उसी सेवा के आवश्यक दस्तावेज़ मांगे जाते हैं (साथ में 2 वैकल्पिक अन्य दस्तावेज़ बॉक्स)। प्रारूप: JPG, JPEG, PNG या PDF — फोटो और हस्ताक्षर अधिकतम 1 MB।',
      proofKicker: 'पूर्ण जांच · भौतिक प्रक्रिया',
      proofHeading: 'भौतिक प्रक्रिया और स्लिप जारी करने से पहले हर आवेदन की पूरी जांच होती है',
      proofDesc:
        'जब आप विवरण और UTR जमा करते हैं, तो एडमिन प्लेटफॉर्म पर सभी बॉक्स और भुगतान की पुष्टि की जाती है, फिर भौतिक कार्य पूरा कर आपकी आधिकारिक स्लिप प्रकाशित की जाती है।',
      statActiveServices: 'सक्रिय सेवाएं',
      statPlatformCharge: 'प्लेटफॉर्म चार्ज',
      statSlipsIssued: 'जारी स्लिप',
      sampleSlipBtn: 'सैंपल जारी स्लिप देखें',
    },
    wizard: {
      pageTitle: 'स्टेप-बाय-स्टेप सेवा फॉर्म और शुल्क भुगतान',
      pageDescPrefix: 'अपनी सेवा श्रेणी चुनें, हर विवरण बॉक्स एक-एक करके भरें और मूल शुल्क +',
      stepLabels: [
        'श्रेणी व सेवा',
        'ग्राहक विवरण',
        'फॉर्म व दस्तावेज़',
        'शुल्क + 20% चार्ज',
        'सबमिट व ट्रैक',
      ],
      step1Title: '01. श्रेणी बॉक्स से सेवा चुनें',
      step1Sub: 'प्रत्येक सेवा में मूल शुल्क + प्लेटफॉर्म सेवा शुल्क स्पष्ट दिखाया गया है।',
      processingSpeedLabel: 'प्रोसेसिंग गति',
      standardDesk: 'सामान्य डेस्क',
      included: 'शामिल',
      expressPriority: 'एक्सप्रेस प्राथमिकता',
      readyIn: 'तैयारी समय:',
      step1Next: 'चरण 2: ग्राहक विवरण भरें',
      step2Title: '02. आवेदक / ग्राहक विवरण (एक-एक करके)',
      selectedServiceLabel: 'चयनित सेवा:',
      fullNameLabel: 'आवेदक का पूरा नाम',
      mobileLabel: 'ग्राहक मोबाइल नंबर (91 सहित)',
      emailLabel: 'ईमेल पता (वैकल्पिक)',
      addressLabel: 'गांव / मकान नं. / पूरा पता',
      cityLabel: 'जिला / शहर',
      pinLabel: 'पिन कोड',
      changeServiceBtn: 'सेवा बदलें',
      step2Next: 'चरण 3: सेवा बॉक्स भरें',
      step3TitlePrefix: '03. आवश्यक बॉक्स भरें —',
      step3Sub:
        'हर बॉक्स सावधानी से भरें। सभी विवरण सत्यापन के लिए सीधे एडमिन प्लेटफॉर्म पर भेजे जाएंगे।',
      serviceBoxesHeading: 'सेवा-विशिष्ट विवरण बॉक्स',
      subjectLabel: 'आवेदन विषय / संक्षिप्त शीर्षक',
      quantityLabel: 'आवेदक / फॉर्म संख्या',
      preferredDateLabel: 'काउंटर प्रोसेसिंग की पसंदीदा तारीख',
      oldRefLabel: 'पुरानी रसीद / संदर्भ संख्या (यदि कोई हो)',
      notesLabel: 'अतिरिक्त टिप्पणी / काउंटर नोट्स',
      docsHeading: 'दस्तावेज़ अपलोड — आवश्यक सहायक दस्तावेज़',
      docsNoteStrong: 'नोट: केवल अपनी सेवा के आवश्यक दस्तावेज़ ही अपलोड करें।',
      docsNoteRest:
        'स्वीकार्य प्रारूप: JPG, JPEG, PNG या PDF (फोटो और हस्ताक्षर अधिकतम 1 MB; अन्य प्रमाण अधिकतम 2 MB)।',
      docsExtraTitle: 'अन्य दस्तावेज़ — 2 अतिरिक्त अपलोड बॉक्स (वैकल्पिक)',
      docsExtraSub:
        'यदि कोई अतिरिक्त दस्तावेज़ जोड़ना हो तो नीचे 2 अतिरिक्त फ़ाइलें अपलोड करें (JPG, JPEG, PNG, PDF · अधिकतम 2 MB)।',
      extraDocNamePlaceholder: 'वैकल्पिक: दस्तावेज़ का नाम लिखें (जैसे शपथ पत्र, पुरानी रसीद)',
      uploadFileBtn: 'फ़ाइल अपलोड करें',
      uploadExtraBtn: 'अतिरिक्त फ़ाइल अपलोड करें',
      uploadingBtn: 'अपलोड हो रहा है...',
      viewBtn: 'देखें',
      removeBtn: 'हटाएं',
      readyAtCounterLabel: 'मेरे पास यह दस्तावेज़ तैयार है (या काउंटर पर जमा करूंगा)',
      backBtn: 'पीछे',
      step3Next: 'चरण 4: समीक्षा व भुगतान',
      step4Title: '04. शुल्क भुगतान पूरा करें (मूल शुल्क + प्लेटफॉर्म चार्ज)',
      step4Sub:
        'नीचे शुल्क विवरण देखें, भुगतान पूरा करें और अपना Transaction ID / UTR नंबर दर्ज करें।',
      origFeeRow: 'मूल सेवा शुल्क',
      platformRow: 'प्लेटफॉर्म सेवा शुल्क',
      expressRow: 'एक्सप्रेस प्राथमिकता शुल्क',
      totalPayableNow: 'कुल देय राशि',
      payMethodUpi: 'UPI / QR',
      payMethodBank: 'बैंक ट्रांसफर',
      payMethodCard: 'कार्ड / ऑनलाइन',
      officialQrHeading: 'आधिकारिक मर्चेंट UPI और स्कैन-पे QR',
      scanQrInstruction:
        'Google Pay, PhonePe, Paytm या BHIM UPI से QR स्कैन करें या नीचे दी गई UPI ID पर भुगतान करें:',
      copyUpi: 'UPI ID कॉपी करें',
      copiedUpi: 'UPI कॉपी हो गई',
      payeeLabel: 'प्राप्तकर्ता:',
      exactAmountLabel: 'सटीक भुगतान राशि:',
      openUpiApp: 'UPI ऐप में खोलें',
      utrLabel: 'Transaction ID / UTR / भुगतान संदर्भ संख्या',
      payerNameLabel: 'खाताधारक / भुगतानकर्ता का नाम',
      paymentScreenshotTitle: 'UPI / भुगतान लेनदेन स्क्रीनशॉट (अनुशंसित)',
      paymentScreenshotSub:
        'त्वरित एडमिन सत्यापन के लिए सफल UPI / GPay / PhonePe / Paytm भुगतान का स्क्रीनशॉट या रसीद संलग्न करें (JPG, JPEG, PNG, PDF · अधिकतम 2 MB)।',
      paymentScreenshotUploadBtn: 'भुगतान स्क्रीनशॉट अपलोड करें',
      paymentScreenshotAttached: 'भुगतान स्क्रीनशॉट संलग्न किया गया',
      paymentScreenshotNone: 'कोई स्क्रीनशॉट संलग्न नहीं',
      confirmPayCheckbox:
        'मैं पुष्टि करता/करती हूं कि मैंने उपरोक्त शुल्क का भुगतान कर दिया है और सभी भरे गए विवरण सही हैं।',
      submittingBtn: 'आवेदन भेजा जा रहा है...',
      submitPayBtn: 'भुगतान पूरा करें और आवेदन सबमिट करें',
      step5Title: 'आवेदन और भुगतान एडमिन प्लेटफॉर्म पर सबमिट हो गया',
      step5Desc:
        'आपके सभी विवरण और UTR प्राप्त हो गए हैं। सत्यापन व भौतिक प्रक्रिया पूरी होने पर आपकी आधिकारिक स्लिप ट्रैक व स्लिप टैब में उपलब्ध होगी।',
      trackDownloadBtn: 'स्थिति ट्रैक करें और स्लिप डाउनलोड करें',
      copyIdBtn: 'ID कॉपी करें',
      copiedIdBtn: 'Request ID कॉपी हुई',
      submitAnotherBtn: 'नया सेवा आवेदन भरें',
      liveFeeSummary: 'लाइव शुल्क विवरण',
      requiredDocsSummary: 'आवश्यक दस्तावेज़',
    },
    track: {
      heading: 'आवेदन ट्रैक करें और आधिकारिक स्लिप डाउनलोड करें',
      subheading:
        'भुगतान स्वीकृति, दस्तावेज़ स्थिति, भौतिक प्रोसेसिंग और आधिकारिक स्लिप देखने के लिए अपना Request ID या मोबाइल नंबर दर्ज करें।',
      searchPlaceholder: 'Request ID (SRV-2026-...) या 10 अंकों का मोबाइल नंबर दर्ज करें',
      searchBtn: 'स्थिति देखें',
      searchingBtn: 'खोज रहे हैं...',
      recentLabel: 'हाल के आवेदन:',
      noMatchTitle: 'कोई आवेदन नहीं मिला',
      noMatchDesc: 'अपना Request ID जांचें या मोबाइल नंबर के अंतिम 8 अंकों से खोजें।',
      docsStatusTitle: 'आवश्यक दस्तावेज़ स्थिति',
      verifiedLabel: 'सत्यापित',
      pendingLabel: 'जांच लंबित',
      missingLabel: 'अनुपलब्ध / आवश्यक',
    },
    topServices: {
      title: 'टॉप 10 सबसे अधिक उपयोग की जाने वाली सेवाएं',
      subtitle: 'विवरण भरने व भुगतान के लिए किसी भी आइकन पर टैप करें',
      scanPayAction: 'QR स्कैन व पे',
      trackSlipAction: 'स्लिप जांचें',
      copyUpiAction: 'UPI कॉपी',
      copiedUpiAction: 'कॉपी हुआ',
      browseAllBtn: 'सभी 21 सेवाएं देखें',
      countSummary: 'टॉप 10 त्वरित सेवाएं · सभी 21 सेवाएं नीचे उपलब्ध हैं',
    },
    footer: {
      helplineLabel: 'हेल्पलाइन',
      whatsappSupport: 'व्हाट्सएप सहायता',
    },
    scrolling: {
      stage1Label: 'सेवा का प्रकार',
      stage2Label: 'व्यक्तिगत विवरण',
      stage3Label: 'पेमेंट गेटवे',
      stage4Label: 'स्लिप / ट्रैकिंग',
      window1Badge: 'विंडो 01 · सेवा का प्रकार चुनें',
      window2Badge: 'विंडो 02 · व्यक्तिगत और सेवा विवरण',
      window2Title: 'व्यक्तिगत विवरण और सेवा-विशिष्ट फॉर्म',
      window2Sub:
        'नीचे दिए गए विवरण बॉक्स और आवश्यक दस्तावेज़ आपकी चुनी हुई सेवा के अनुसार बदलते हैं।',
      window2SubPersonal: '2A. ग्राहक व्यक्तिगत विवरण',
      window2SubService: '2B. सेवा बॉक्स और आवश्यक दस्तावेज़',
      window3Badge: 'विंडो 03 · पेमेंट गेटवे',
      window3Title: 'पेमेंट गेटवे (मूल शुल्क + प्लेटफॉर्म चार्ज)',
      window3Sub:
        'QR स्कैन करें या UPI/बैंक/कार्ड से भुगतान करें, UTR नंबर लिखें, स्क्रीनशॉट अपलोड करें और सबमिट करें।',
      window4Badge: 'विंडो 04 · स्लिप / ट्रैकिंग रिकॉर्ड',
      window4Title: 'आधिकारिक स्लिप और लाइव ट्रैकिंग रिकॉर्ड',
      window4Sub:
        'अपनी नई जमा की गई स्लिप देखें, दस्तावेज़ जांच की स्थिति जानें या कोई भी पुराना Request ID खोजें।',
      activeWindowTag: 'सक्रिय विंडो',
      selectedServiceBanner: 'चयनित सेवा प्रकार:',
      continueToPersonalBtn: 'आगे: व्यक्तिगत व सेवा विवरण',
      continueToServiceBoxesBtn: 'आगे: सेवा बॉक्स व आवश्यक दस्तावेज़',
      continueToPaymentBtn: 'आगे: पेमेंट गेटवे',
      backToServiceTypeBtn: 'सेवा प्रकार बदलें',
      backToPersonalBtn: 'व्यक्तिगत विवरण पर वापस जाएं',
      submitToSlipBtn: 'भुगतान पूरा करें और स्लिप देखें',
      justSubmittedTitle: 'भुगतान सबमिट हो गया · स्लिप व ट्रैकिंग तैयार है',
      justSubmittedDesc:
        'आपका आवेदन और भुगतान प्रमाण सुरक्षित है। नीचे लाइव स्थिति देखें और आधिकारिक स्लिप प्रिंट करें।',
    },
    auth: {
      loginRegisterBtn: 'साइन इन / साइन अप',
      myProfileBtn: 'मेरी प्रोफाइल',
      modalTitleSignIn: 'ग्राहक साइन इन (फ़ोन / Gmail / Facebook)',
      modalTitleSignUp: 'नया ग्राहक खाता और प्रोफाइल बनाएं',
      modalTitleProfile: 'ग्राहक प्रोफाइल और मेरे आवेदन',
      tabSignIn: 'साइन इन',
      tabSignUp: 'नया खाता (Sign Up)',
      tabProfile: 'प्रोफाइल व आवेदन',
      providerLabel: 'लॉगिन माध्यम चुनें',
      providerPhone: 'फ़ोन नंबर',
      providerGmail: 'Gmail',
      providerFacebook: 'Facebook',
      identifierPhoneLabel: 'पंजीकृत मोबाइल नंबर (91 सहित)',
      identifierGmailLabel: 'Gmail / ईमेल पता',
      identifierFacebookLabel: 'Facebook आईडी / यूज़रनेम या ईमेल',
      passwordLabel: 'खाता पासवर्ड (कम से कम 4 अक्षर)',
      fullNameLabel: 'आवेदक का पूरा नाम',
      phoneOptionalLabel: 'मोबाइल नंबर (91 सहित)',
      emailOptionalLabel: 'Gmail / ईमेल पता',
      facebookOptionalLabel: 'Facebook प्रोफाइल / आईडी (वैकल्पिक)',
      profilePhotoLabel: 'प्रोफाइल फोटो (वैकल्पिक)',
      profilePhotoRule: 'JPG / JPEG / PNG · अधिकतम 1 MB',
      uploadPhotoBtn: 'फोटो अपलोड करें',
      changePhotoBtn: 'फोटो बदलें',
      removePhotoBtn: 'हटाएं',
      additionalDetailsTitle: 'अतिरिक्त प्रोफाइल विवरण (भविष्य के फॉर्म स्वतः भरेंगे)',
      dobLabel: 'जन्म तिथि',
      genderLabel: 'लिंग',
      guardianLabel: 'पिता / माता / अभिभावक का नाम',
      addressLabel: 'गांव / मकान नं. / पूरा पता',
      cityLabel: 'जिला / शहर',
      pinLabel: 'पिन कोड',
      bioNotesLabel: 'अतिरिक्त जानकारी / सेवा नोट्स',
      termsHeading: 'अनिवार्य नियम एवं शर्तें (खाता और सेवा उपयोग के लिए आवश्यक)',
      termsRequiredBadge: 'अनिवार्य',
      termsClauses: [
        '1. सटीक विवरण और मूल दस्तावेज़: आप पुष्टि करते हैं कि सभी व्यक्तिगत जानकारी, सेवा बॉक्स और अपलोड किए गए दस्तावेज़ (चैट में भेजे गए छूटे दस्तावेज़ सहित) सत्य और मूल अभिलेखों के अनुरूप हैं।',
        '2. शुल्क पारदर्शिता व जांच: प्रत्येक सेवा शुल्क में मूल शुल्क + पारदर्शी प्लेटफॉर्म सेवा शुल्क शामिल है। एडमिन द्वारा UTR व दस्तावेज़ जांच के बाद ही भौतिक कार्य किया जाता है।',
        '3. डायरेक्ट एडमिन चैट नियम: डायरेक्ट एडमिन-ग्राहक चैट बॉक्स केवल स्वीकृत (Approved) या लंबित (Pending) आवेदनों के लिए खुलता है ताकि छूटे दस्तावेज़ व आधिकारिक स्लिप भेजी जा सके। अस्वीकृत (Rejected) आवेदन पर चैट बंद रहती है।',
        '4. डेटा गोपनीयता व सहायता: आपकी फोटो व दस्तावेज़ केवल सेवा फाइलिंग और स्लिप बनाने हेतु उपयोग होते हैं। सहायता: WhatsApp +91 9520951867।',
      ],
      termsAcceptCheckbox:
        'मैंने उपरोक्त नियम एवं शर्तें पढ़ ली हैं और Mr Ashraf Banking Traveling Communication के उपयोग हेतु सहमत हूं।',
      submitSignInBtn: 'पोर्टल में साइन इन करें',
      submitSignUpBtn: 'शर्तें स्वीकार करें व खाता बनाएं',
      saveProfileBtn: 'प्रोफाइल अपडेट सेव करें',
      savingBtn: 'सेव हो रहा है...',
      signOutBtn: 'साइन आउट',
      signedInAsLabel: 'लॉगिन माध्यम:',
      myAppsTitle: 'मेरे सबमिट आवेदन और चैट स्थिति',
      myAppsEmpty: 'आपकी प्रोफाइल से जुड़ा कोई आवेदन अभी नहीं है।',
      openInTrackChatBtn: 'स्लिप व चैट खोलें',
      chatUnlockedPill: 'चैट खुला है',
      chatLockedPill: 'अस्वीकृत · चैट बंद',
      applyWithProfileNote: 'आपकी प्रोफाइल से विवरण नीचे स्वतः भर गए हैं।',
    },
    chat: {
      boxTitle: 'डायरेक्ट एडमिन ↔ ग्राहक चैट बॉक्स',
      unlockedApprovedBadge: 'स्वीकृत · चैट अनलॉक',
      unlockedPendingBadge: 'लंबित · चैट अनलॉक',
      lockedRejectedBadge: 'अस्वीकृत · चैट लॉक',
      lockedTitle: 'चैट बॉक्स लॉक है — आवेदन अस्वीकृत (Rejected)',
      lockedDesc:
        'यह आवेदन या भुगतान एडमिन जांच में अस्वीकृत (Rejected) किया गया है। डायरेक्ट चैट, छूटे दस्तावेज़ भेजना और स्लिप ट्रांसफर केवल Approved या Pending आवेदनों के लिए खुलता है।',
      unlockedSub:
        'श्री अशरफ से सेवा के बारे में अधिक बात करें, कोई छूटा हुआ दस्तावेज़ भेजें और कार्य पूर्ण होने पर यहीं से अपनी आधिकारिक स्लिप प्राप्त करें।',
      emptyChatText: 'अभी कोई संदेश नहीं है। सेवा विवरण पूछें या नीचे से छूटा हुआ दस्तावेज़ भेजें।',
      messagePlaceholder: 'सेवा विवरण या दस्तावेज़ के बारे में संदेश लिखें...',
      sendBtn: 'संदेश भेजें',
      sendingBtn: 'भेज रहे हैं...',
      missedDocTitle: 'छूटा हुआ / अतिरिक्त दस्तावेज़ भेजें',
      missedDocSelectLabel: 'दस्तावेज़ चुनें',
      missedDocGeneralOption: 'सामान्य / छूटा हुआ सहायक दस्तावेज़',
      attachDocBtn: 'दस्तावेज़ संलग्न कर भेजें',
      uploadingDocBtn: 'अपलोड हो रहा है...',
      slipTransferredTitle: 'कार्य पूर्ण · आधिकारिक स्लिप भेज दी गई है',
      slipNumberLabel: 'स्लिप नं.',
      viewPrintSlipBtn: 'आधिकारिक स्लिप देखें और प्रिंट करें',
      adminAllDoneBtn: 'All Done · स्लिप बनाएं व ग्राहक को भेजें',
      adminAllDoneSub: 'आधिकारिक स्लिप जारी कर सीधे ग्राहक चैट में भेजता है',
      liveBadge: 'लाइव रूम',
    },
  },
  bn: {
    nav: {
      services: 'পরিষেবার ধরন',
      fillDetails: 'ব্যক্তিগত তথ্য',
      paymentGateway: 'পেমেন্ট গেটওয়ে',
      trackSlip: 'স্লিপ / ট্র্যাক',
      adminPlatform: 'অ্যাডমিন প্ল্যাটফর্ম',
      startRequest: 'আবেদন শুরু করুন',
      backToPortal: 'গ্রাহক পোর্টালে ফিরে যান',
    },
    supportBar: {
      label: 'হোয়াটসঅ্যাপ সহায়তা',
      chatBtn: 'হোয়াটসঅ্যাপে চ্যাট',
      callBtn: 'কল',
      languageLabel: 'ভাষা',
    },
    hero: {
      kicker: 'নাগরিক পরিষেবা ডেস্ক · ব্যাংকিং ও ভ্রমণ · অফিশিয়াল স্লিপ',
      title: 'ধাপে ধাপে সব তথ্য পূরণ করুন। ফি পেমেন্ট করে অফিশিয়াল স্লিপ সংগ্রহ করুন।',
      subtitle:
        'পরিচয়পত্র, ব্যাংকিং, সরকারি প্রকল্প, শিক্ষা বা ভ্রমণ বিভাগ থেকে আপনার পরিষেবা বেছে নিন। প্রতিটি বক্স একে একে পূরণ করুন, শুধুমাত্র প্রয়োজনীয় নথি আপলোড করুন, মূল ফি + প্ল্যাটফর্ম চার্জ QR/UPI-এ পরিশোধ করুন এবং আপনার যাচাইকৃত অফিশিয়াল স্লিপ পান।',
      startCta: 'পরিষেবা আবেদন শুরু করুন',
      trackCta: 'স্ট্যাটাস ও স্লিপ দেখুন',
      steps: [
        {
          title: '০১. পরিষেবা ও বক্স পূরণ',
          desc: 'আপনার বিভাগ বেছে নিন এবং প্রতিটি তথ্য বক্স একে একে পূরণ করুন।',
        },
        {
          title: '০২. নথি ও ফি পেমেন্ট',
          desc: 'শুধু প্রয়োজনীয় নথি আপলোড করুন এবং QR/UPI-এ মূল ফি + ২০% চার্জ দিন।',
        },
        {
          title: '০৩. অ্যাডমিন যাচাইকরণ',
          desc: 'আপনার সমস্ত তথ্য এবং পেমেন্ট UTR সরাসরি আমাদের অ্যাডমিন প্ল্যাটফর্মে যাচাই হয়।',
        },
        {
          title: '০৪. কাজ সম্পন্ন ও স্লিপ',
          desc: 'মিস্টার আশরাফ সঠিকভাবে যাচাই ও ফিজিক্যাল কাজ সম্পন্ন করে অফিশিয়াল স্লিপ প্রদান করেন।',
        },
      ],
    },
    catalog: {
      heading: 'সমস্ত পরিষেবা — বিভাগ অনুযায়ী সুন্দরভাবে সাজানো',
      subheading:
        'ধাপে ধাপে ফর্ম খুলতে নিচে অনুসন্ধান করুন বা যেকোনো বিভাগ বেছে নিন। প্রতিটি পরিষেবায় মূল ফি + প্ল্যাটফর্ম সার্ভিস চার্জ স্পষ্টভাবে দেখানো হয়েছে।',
      searchPlaceholder: 'পরিষেবা খুঁজুন (যেমন আধার, প্যান, পিএম কিষাণ, IRCTC, জন্ম, স্কলারশিপ)...',
      allCategories: 'সব ৫টি বিভাগ',
      servicesAvailable: 'টি পরিষেবা উপলব্ধ',
      requiredLabel: 'প্রয়োজনীয় নথি',
      originalLabel: 'মূল ফি',
      chargeLabel: 'চার্জ',
      totalLabel: 'মোট',
      applyBtn: 'তথ্য পূরণ ও আবেদন করুন',
      noMatchTitle: 'কোনো পরিষেবা পাওয়া যায়নি',
      noMatchDesc: 'অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা সব ৫টি বিভাগ নির্বাচন করুন।',
      clearFilters: 'সব পরিষেবা দেখান',
      docsSectionTitle: 'পোর্টাল সহায়ক নথি ও আপলোডের নিয়ম',
      docsSectionNotePrefix: 'বিঃদ্রঃ শুধুমাত্র আপনার পরিষেবার প্রয়োজনীয় নথিই আপলোড করুন।',
      docsSectionDesc:
        'প্রতিটি পরিষেবায় কেবল সেই পরিষেবার কার্ডে উল্লেখিত প্রয়োজনীয় নথিই চাওয়া হয় (সাথে ২টি অতিরিক্ত ঐচ্ছিক নথির বক্স)। ফরম্যাট: JPG, JPEG, PNG বা PDF — ছবি ও স্বাক্ষর সর্বোচ্চ ১ MB।',
      proofKicker: 'সঠিক যাচাই · ফিজিক্যাল প্রসেসিং',
      proofHeading: 'ফিজিক্যাল প্রসেসিং ও স্লিপ ইস্যুর আগে প্রতিটি আবেদন সঠিকভাবে যাচাই করা হয়',
      proofDesc:
        'আপনি আপনার তথ্য ও পেমেন্ট UTR জমা দেওয়ার পর অ্যাডমিন প্ল্যাটফর্মে সব কিছু যাচাই করা হয়, ফিজিক্যাল প্রসেসিং সম্পন্ন হয় এবং আপনার অফিশিয়াল স্লিপ PDF প্রিন্টের জন্য প্রকাশ করা হয়।',
      statActiveServices: 'সক্রিয় পরিষেবা',
      statPlatformCharge: 'প্ল্যাটফর্ম চার্জ',
      statSlipsIssued: 'ইস্যুকৃত স্লিপ',
      sampleSlipBtn: 'নমুনা ইস্যুকৃত স্লিপ দেখুন',
    },
    wizard: {
      pageTitle: 'ধাপে ধাপে পরিষেবা ফর্ম ও ফি পেমেন্ট',
      pageDescPrefix: 'আপনার পরিষেবা বিভাগ নির্বাচন করুন, প্রতিটি বক্স একে একে পূরণ করুন, মূল ফি +',
      stepLabels: [
        'বিভাগ ও পরিষেবা',
        'গ্রাহকের তথ্য',
        'ফর্ম ও নথি আপলোড',
        'ফি + ২০% চার্জ',
        'জমা ও ট্র্যাক',
      ],
      step1Title: '০১. বিভাগ বক্স থেকে পরিষেবা নির্বাচন করুন',
      step1Sub: 'প্রতিটি পরিষেবায় মূল ফি + প্ল্যাটফর্ম চার্জ পরিষ্কারভাবে দেখানো হয়েছে।',
      processingSpeedLabel: 'প্রসেসিং গতি',
      standardDesk: 'সাধারণ ডেস্ক',
      included: 'অন্তর্ভুক্ত',
      expressPriority: 'এক্সপ্রেস অগ্রাধিকার',
      readyIn: 'সময় লাগবে:',
      step1Next: 'ধাপ ২: গ্রাহকের তথ্য পূরণ করুন',
      step2Title: '০২. আবেদনকারীর / গ্রাহকের তথ্য (একে একে)',
      selectedServiceLabel: 'নির্বাচিত পরিষেবা:',
      fullNameLabel: 'আবেদনকারীর পুরো নাম',
      mobileLabel: 'গ্রাহকের মোবাইল নম্বর (91 সহ)',
      emailLabel: 'ইমেল ঠিকানা (ঐচ্ছিক)',
      addressLabel: 'গ্রাম / বাড়ি নং / রাস্তার ঠিকানা',
      cityLabel: 'জেলা / শহর',
      pinLabel: 'পিন কোড',
      changeServiceBtn: 'পরিষেবা বদলান',
      step2Next: 'ধাপ ৩: পরিষেবা বক্স পূরণ করুন',
      step3TitlePrefix: '০৩. প্রয়োজনীয় বক্স পূরণ করুন —',
      step3Sub:
        'প্রতিটি বক্স যত্ন সহকারে পূরণ করুন। সমস্ত তথ্য যাচাইয়ের জন্য সরাসরি অ্যাডমিন প্ল্যাটফর্মে পাঠানো হবে।',
      serviceBoxesHeading: 'পরিষেবা-ভিত্তিক নির্দিষ্ট তথ্য বক্স',
      subjectLabel: 'আবেদনের বিষয় / সংক্ষিপ্ত শিরোনাম',
      quantityLabel: 'আবেদনকারী / ফর্ম সংখ্যা',
      preferredDateLabel: 'কাউন্টার প্রসেসিংয়ের পছন্দের তারিখ',
      oldRefLabel: 'পুরানো রসিদ / রেফারেন্স নম্বর (যদি থাকে)',
      notesLabel: 'অতিরিক্ত মন্তব্য / কাউন্টার নোট',
      docsHeading: 'নথি আপলোড — প্রয়োজনীয় সহায়ক নথিপত্র',
      docsNoteStrong: 'বিঃদ্রঃ শুধুমাত্র আপনার পরিষেবার প্রয়োজনীয় নথিই আপলোড করুন।',
      docsNoteRest:
        'গ্রহণযোগ্য ফরম্যাট: JPG, JPEG, PNG বা PDF (আবেদনকারীর ছবি ও স্বাক্ষর সর্বোচ্চ ১ MB; অন্যান্য প্রমাণপত্র সর্বোচ্চ ২ MB)।',
      docsExtraTitle: 'অন্যান্য নথি — ২টি অতিরিক্ত আপলোড বক্স (ঐচ্ছিক)',
      docsExtraSub:
        'কোনো অতিরিক্ত নথি যুক্ত করতে চাইলে নিচের ২টি অতিরিক্ত বক্সে আপলোড করুন (JPG, JPEG, PNG, PDF · সর্বোচ্চ ২ MB)।',
      extraDocNamePlaceholder: 'ঐচ্ছিক: নথির নাম লিখুন (যেমন হলফনামা, পুরানো রসিদ)',
      uploadFileBtn: 'ফাইল আপলোড করুন',
      uploadExtraBtn: 'অতিরিক্ত ফাইল আপলোড',
      uploadingBtn: 'আপলোড হচ্ছে...',
      viewBtn: 'দেখুন',
      removeBtn: 'মুছুন',
      readyAtCounterLabel: 'আমার কাছে এই নথি প্রস্তুত আছে (অথবা কাউন্টারে জমা দেব)',
      backBtn: 'পেছনে',
      step3Next: 'ধাপ ৪: ফি পর্যালোচনা ও পেমেন্ট',
      step4Title: '০৪. পেমেন্ট সম্পন্ন করুন (মূল ফি + প্ল্যাটফর্ম চার্জ)',
      step4Sub:
        'নিচে ফি-এর হিসাব দেখে পেমেন্ট সম্পন্ন করুন এবং আপনার Transaction ID / UTR নম্বর লিখুন।',
      origFeeRow: 'মূল পরিষেবা ফি',
      platformRow: 'প্ল্যাটফর্ম সার্ভিস চার্জ',
      expressRow: 'এক্সপ্রেস অগ্রাধিকার চার্জ',
      totalPayableNow: 'সর্বমোট প্রদেয়',
      payMethodUpi: 'UPI / QR',
      payMethodBank: 'ব্যাংক ট্রান্সফার',
      payMethodCard: 'কার্ড / অনলাইন',
      officialQrHeading: 'অফিশিয়াল মার্চেন্ট UPI ও স্ক্যান-পে QR',
      scanQrInstruction:
        'Google Pay, PhonePe, Paytm বা BHIM UPI দিয়ে QR স্ক্যান করুন অথবা নিচের UPI ID-তে পেমেন্ট করুন:',
      copyUpi: 'UPI ID কপি করুন',
      copiedUpi: 'UPI কপি হয়েছে',
      payeeLabel: 'প্রাপক:',
      exactAmountLabel: 'সঠিক প্রদেয় পরিমাণ:',
      openUpiApp: 'UPI অ্যাপে খুলুন',
      utrLabel: 'Transaction ID / UTR / পেমেন্ট রেফারেন্স',
      payerNameLabel: 'অ্যাকাউন্ট হোল্ডার / পেয়ার নাম',
      paymentScreenshotTitle: 'UPI / পেমেন্ট ট্রানজ্যাকশন স্ক্রিনশট (প্রস্তাবিত)',
      paymentScreenshotSub:
        'অ্যাডমিন যাচাইকরণ সহজ করতে সফল UPI / GPay / PhonePe / Paytm পেমেন্টের স্ক্রিনশট বা রসিদ যুক্ত করুন (JPG, JPEG, PNG, PDF · সর্বোচ্চ ২ MB)।',
      paymentScreenshotUploadBtn: 'পেমেন্ট স্ক্রিনশট আপলোড করুন',
      paymentScreenshotAttached: 'পেমেন্ট স্ক্রিনশট যুক্ত হয়েছে',
      paymentScreenshotNone: 'কোনো স্ক্রিনশট যুক্ত নেই',
      confirmPayCheckbox:
        'আমি নিশ্চিত করছি যে উপরের সম্পূর্ণ ফি পেমেন্ট করেছি এবং সমস্ত তথ্য সঠিকভাবে পূরণ করেছি।',
      submittingBtn: 'আবেদন জমা হচ্ছে...',
      submitPayBtn: 'পেমেন্ট সম্পন্ন করে আবেদন জমা দিন',
      step5Title: 'আবেদন ও ফি পেমেন্ট অ্যাডমিন প্ল্যাটফর্মে জমা হয়েছে',
      step5Desc:
        'আপনার সমস্ত তথ্য ও পেমেন্ট রেফারেন্স গৃহীত হয়েছে। যাচাই ও ফিজিক্যাল কাজ সম্পন্ন হলে ট্র্যাক ও স্লিপ পেজে আপনার অফিশিয়াল স্লিপ দেখা যাবে।',
      trackDownloadBtn: 'স্ট্যাটাস ট্র্যাক ও স্লিপ ডাউনলোড',
      copyIdBtn: 'ID কপি করুন',
      copiedIdBtn: 'Request ID কপি হয়েছে',
      submitAnotherBtn: 'নতুন পরিষেবা আবেদন করুন',
      liveFeeSummary: 'লাইভ ফি হিসাব',
      requiredDocsSummary: 'প্রয়োজনীয় নথিপত্র',
    },
    track: {
      heading: 'আবেদন ট্র্যাক করুন ও অফিশিয়াল স্লিপ ডাউনলোড করুন',
      subheading:
        'পেমেন্ট অনুমোদন, নথির অবস্থা, ফিজিক্যাল প্রসেসিং এবং অফিশিয়াল স্লিপ দেখতে আপনার Request ID বা মোবাইল নম্বর লিখুন।',
      searchPlaceholder: 'Request ID (SRV-2026-...) অথবা ১০ সংখ্যার মোবাইল নম্বর লিখুন',
      searchBtn: 'স্ট্যাটাস দেখুন',
      searchingBtn: 'খোঁজা হচ্ছে...',
      recentLabel: 'সাম্প্রতিক আবেদন:',
      noMatchTitle: 'কোনো আবেদন পাওয়া যায়নি',
      noMatchDesc: 'আপনার Request ID যাচাই করুন অথবা মোবাইল নম্বরের শেষ ৮টি সংখ্যা দিয়ে খুঁজুন।',
      docsStatusTitle: 'প্রয়োজনীয় নথির অবস্থা',
      verifiedLabel: 'যাচাইকৃত',
      pendingLabel: 'যাচাই বাকি',
      missingLabel: 'অনুপস্থিত / প্রয়োজন',
    },
    topServices: {
      title: 'সবচেয়ে বেশি ব্যবহৃত শীর্ষ ১০টি পরিষেবা',
      subtitle: 'ফর্ম পূরণ ও ফি পেমেন্ট করতে যেকোনো আইকনে ট্যাপ করুন',
      scanPayAction: 'QR স্ক্যান ও পে',
      trackSlipAction: 'স্লিপ দেখুন',
      copyUpiAction: 'UPI কপি',
      copiedUpiAction: 'কপি হয়েছে',
      browseAllBtn: 'সব ২১টি পরিষেবা দেখুন',
      countSummary: 'শীর্ষ ১০ কুইক সার্ভিস · সব ২১টি পরিষেবা নিচে রয়েছে',
    },
    footer: {
      helplineLabel: 'হেল্পলাইন',
      whatsappSupport: 'হোয়াটসঅ্যাপ সহায়তা',
    },
    scrolling: {
      stage1Label: 'পরিষেবার ধরন',
      stage2Label: 'ব্যক্তিগত তথ্য',
      stage3Label: 'পেমেন্ট গেটওয়ে',
      stage4Label: 'স্লিপ / ট্র্যাকিং',
      window1Badge: 'উইন্ডো ০১ · পরিষেবার ধরন নির্বাচন',
      window2Badge: 'উইন্ডো ০২ · ব্যক্তিগত ও পরিষেবা তথ্য',
      window2Title: 'ব্যক্তিগত তথ্য ও পরিষেবা-ভিত্তিক ফর্ম',
      window2Sub:
        'নির্বাচিত পরিষেবার ধরন অনুযায়ী ফর্মের বক্স এবং প্রয়োজনীয় নথিপত্র স্বয়ংক্রিয়ভাবে দেখাবে।',
      window2SubPersonal: '২A. গ্রাহকের ব্যক্তিগত তথ্য',
      window2SubService: '২B. পরিষেবা বক্স ও প্রয়োজনীয় নথিপত্র',
      window3Badge: 'উইন্ডো ০৩ · পেমেন্ট গেটওয়ে',
      window3Title: 'পেমেন্ট গেটওয়ে (মূল ফি + প্ল্যাটফর্ম চার্জ)',
      window3Sub:
        'মার্চেন্ট QR স্ক্যান করুন অথবা UPI/ব্যাংক/কার্ডে পেমেন্ট করে UTR, স্ক্রিনশট দিন এবং কনফার্ম করুন।',
      window4Badge: 'উইন্ডো ০৪ · স্লিপ / ট্র্যাকিং রেকর্ড',
      window4Title: 'অফিশিয়াল স্লিপ ও লাইভ ট্র্যাকিং রেকর্ড',
      window4Sub:
        'সদ্য জমা দেওয়া স্লিপ দেখুন, নথি যাচাইয়ের অগ্রগতি পরীক্ষা করুন অথবা যেকোনো Request ID খুঁজুন।',
      activeWindowTag: 'সক্রিয় উইন্ডো',
      selectedServiceBanner: 'নির্বাচিত পরিষেবা:',
      continueToPersonalBtn: 'পরবর্তী: ব্যক্তিগত ও পরিষেবা তথ্য',
      continueToServiceBoxesBtn: 'পরবর্তী: পরিষেবা বক্স ও নথিপত্র',
      continueToPaymentBtn: 'পরবর্তী: পেমেন্ট গেটওয়ে',
      backToServiceTypeBtn: 'পরিষেবার ধরন বদলান',
      backToPersonalBtn: 'ব্যক্তিগত তথ্যে ফিরে যান',
      submitToSlipBtn: 'পেমেন্ট সম্পন্ন করে স্লিপ দেখুন',
      justSubmittedTitle: 'পেমেন্ট জমা হয়েছে · স্লিপ ও ট্র্যাকিং প্রস্তুত',
      justSubmittedDesc:
        'আপনার সমস্ত তথ্য ও পেমেন্ট প্রমাণ সংরক্ষিত হয়েছে। নিচে লাইভ স্ট্যাটাস দেখুন ও অফিশিয়াল স্লিপ প্রিন্ট করুন।',
    },
    auth: {
      loginRegisterBtn: 'সাইন ইন / সাইন আপ',
      myProfileBtn: 'আমার প্রোফাইল',
      modalTitleSignIn: 'গ্রাহক সাইন ইন (ফোন / Gmail / Facebook)',
      modalTitleSignUp: 'গ্রাহক অ্যাকাউন্ট ও প্রোফাইল তৈরি করুন',
      modalTitleProfile: 'গ্রাহক প্রোফাইল ও আমার আবেদন',
      tabSignIn: 'সাইন ইন',
      tabSignUp: 'সাইন আপ (নতুন)',
      tabProfile: 'প্রোফাইল ও আবেদন',
      providerLabel: 'লগইন মাধ্যম বেছে নিন',
      providerPhone: 'ফোন নম্বর',
      providerGmail: 'Gmail',
      providerFacebook: 'Facebook',
      identifierPhoneLabel: 'নিবন্ধিত মোবাইল নম্বর (91 সহ)',
      identifierGmailLabel: 'Gmail / ইমেল ঠিকানা',
      identifierFacebookLabel: 'Facebook আইডি / প্রোফাইল নাম বা ইমেল',
      passwordLabel: 'অ্যাকাউন্ট পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)',
      fullNameLabel: 'আবেদনকারীর পুরো নাম',
      phoneOptionalLabel: 'মোবাইল নম্বর (91 সহ)',
      emailOptionalLabel: 'Gmail / ইমেল ঠিকানা',
      facebookOptionalLabel: 'Facebook প্রোফাইল / আইডি (ঐচ্ছিক)',
      profilePhotoLabel: 'প্রোফাইল ছবি (ঐচ্ছিক)',
      profilePhotoRule: 'JPG / JPEG / PNG · সর্বোচ্চ ১ MB',
      uploadPhotoBtn: 'ছবি আপলোড করুন',
      changePhotoBtn: 'ছবি বদলান',
      removePhotoBtn: 'মুছুন',
      additionalDetailsTitle: 'অতিরিক্ত প্রোফাইল তথ্য (ভবিষ্যতের ফর্মে স্বয়ংক্রিয়ভাবে পূরণ হবে)',
      dobLabel: 'জন্ম তারিখ',
      genderLabel: 'লিঙ্গ',
      guardianLabel: 'পিতা / মাতা / অভিভাবকের নাম',
      addressLabel: 'গ্রাম / বাড়ি নং / রাস্তার ঠিকানা',
      cityLabel: 'জেলা / শহর',
      pinLabel: 'পিন কোড',
      bioNotesLabel: 'অতিরিক্ত নোট / পরিষেবা পছন্দ',
      termsHeading: 'আবশ্যিক শর্তাবলী (অ্যাকাউন্ট ও পরিষেবা ব্যবহারের জন্য প্রয়োজন)',
      termsRequiredBadge: 'আবশ্যিক',
      termsClauses: [
        '১. সঠিক তথ্য ও মূল নথি: আপনি নিশ্চিত করছেন যে সমস্ত ব্যক্তিগত তথ্য, পরিষেবা ফর্মের বিবরণ এবং আপলোড করা নথি (চ্যাটে পাঠানো বাদ পড়া নথি সহ) সত্য ও আপনার মূল নথির সাথে মেলে।',
        '২. স্বচ্ছ ফি ও যাচাইকরণ: প্রতিটি পরিষেবা ফি-তে মূল ফি + স্বচ্ছ প্ল্যাটফর্ম চার্জ অন্তর্ভুক্ত। অ্যাডমিন UTR ও নথি যাচাইয়ের পরই ফিজিক্যাল কাজ করা হয়।',
        '৩. সরাসরি অ্যাডমিন চ্যাট নীতি: সরাসরি অ্যাডমিন-টু-গ্রাহক চ্যাট বক্স শুধুমাত্র অনুমোদিত (Approved) বা মুলতুবি (Pending) আবেদনের জন্যই আনলক হয়। বাতিল (Rejected) আবেদনের চ্যাট লক থাকে।',
        '৪. তথ্য সুরক্ষা ও সহায়তা: আপনার প্রোফাইল ছবি ও নথি শুধুমাত্র অফিশিয়াল আবেদন ও স্লিপ তৈরিতে ব্যবহৃত হয়। সহায়তা: WhatsApp +91 9520951867।',
      ],
      termsAcceptCheckbox:
        'আমি উপরের শর্তাবলী পড়েছি এবং Mr Ashraf Banking Traveling Communication ব্যবহারের জন্য সম্মত আছি।',
      submitSignInBtn: 'পোর্টালে সাইন ইন করুন',
      submitSignUpBtn: 'শর্তাবলী মেনে অ্যাকাউন্ট তৈরি করুন',
      saveProfileBtn: 'প্রোফাইল আপডেট সেভ করুন',
      savingBtn: 'সেভ হচ্ছে...',
      signOutBtn: 'সাইন আউট',
      signedInAsLabel: 'লগইন মাধ্যম:',
      myAppsTitle: 'আমার জমা দেওয়া আবেদন ও চ্যাট অ্যাক্সেস',
      myAppsEmpty: 'আপনার প্রোফাইলের সাথে এখনো কোনো আবেদন যুক্ত নেই।',
      openInTrackChatBtn: 'স্লিপ ও চ্যাট খুলুন',
      chatUnlockedPill: 'চ্যাট আনলক',
      chatLockedPill: 'বাতিল · চ্যাট লক',
      applyWithProfileNote: 'আপনার প্রোফাইল থেকে নিচের তথ্য স্বয়ংক্রিয়ভাবে পূরণ হয়েছে।',
    },
    chat: {
      boxTitle: 'সরাসরি অ্যাডমিন ↔ গ্রাহক সাপোর্ট চ্যাট বক্স',
      unlockedApprovedBadge: 'অনুমোদিত · চ্যাট আনলক',
      unlockedPendingBadge: 'মুলতুবি · চ্যাট আনলক',
      lockedRejectedBadge: 'বাতিল · চ্যাট লক',
      lockedTitle: 'চ্যাট বক্স লক — আবেদন বাতিল (Rejected)',
      lockedDesc:
        'অ্যাডমিন যাচাইয়ে এই আবেদন বা পেমেন্ট বাতিল (Rejected) হয়েছে। সরাসরি চ্যাট, বাদ পড়া নথি পাঠানো ও স্লিপ ট্রান্সফার শুধুমাত্র Approved বা Pending আবেদনের জন্য খোলা থাকে।',
      unlockedSub:
        'মিস্টার আশরাফের সাথে সরাসরি কথা বলুন, কোনো বাদ পড়া নথি পাঠান এবং কাজ সম্পন্ন হলে এখান থেকেই আপনার অফিশিয়াল স্লিপ সংগ্রহ করুন।',
      emptyChatText: 'এখনো কোনো বার্তা নেই। পরিষেবা সম্পর্কে জিজ্ঞাসা করুন অথবা নিচে থেকে বাদ পড়া নথি পাঠান।',
      messagePlaceholder: 'পরিষেবা বা নথি সম্পর্কে বার্তা লিখুন...',
      sendBtn: 'বার্তা পাঠান',
      sendingBtn: 'পাঠানো হচ্ছে...',
      missedDocTitle: 'বাদ পড়া / অতিরিক্ত সহায়ক নথি পাঠান',
      missedDocSelectLabel: 'নথির ধরন',
      missedDocGeneralOption: 'সাধারণ / বাদ পড়া সহায়ক নথি',
      attachDocBtn: 'নথি যুক্ত করে পাঠান',
      uploadingDocBtn: 'আপলোড হচ্ছে...',
      slipTransferredTitle: 'সব কাজ সম্পন্ন · অফিশিয়াল স্লিপ পাঠানো হয়েছে',
      slipNumberLabel: 'স্লিপ নং',
      viewPrintSlipBtn: 'অফিশিয়াল স্লিপ দেখুন ও প্রিন্ট করুন',
      adminAllDoneBtn: 'All Done · স্লিপ তৈরি করে গ্রাহককে পাঠান',
      adminAllDoneSub: 'অফিশিয়াল স্লিপ তৈরি করে সরাসরি গ্রাহকের চ্যাটে পাঠায়',
      liveBadge: 'লাইভ রুম',
    },
  },
};

export const TOP_TEN_SHORT_LABELS: Record<
  string,
  Record<AppLanguage, { label: string; sub: string }>
> = {
  'srv-aadhaar': {
    en: { label: 'Aadhaar Card', sub: 'Update & Link' },
    hi: { label: 'आधार कार्ड', sub: 'अपडेट व लिंक' },
    bn: { label: 'আধার কার্ড', sub: 'আপডেট ও লিংক' },
  },
  'srv-pan': {
    en: { label: 'PAN Card', sub: 'New & Correction' },
    hi: { label: 'पैन कार्ड', sub: 'नया व सुधार' },
    bn: { label: 'প্যান কার্ড', sub: 'নতুন ও সংশোধন' },
  },
  'srv-voter-id': {
    en: { label: 'Voter ID', sub: 'Form 6 & 8' },
    hi: { label: 'वोटर आईडी', sub: 'फॉर्म 6 व 8' },
    bn: { label: 'ভোটার আইডি', sub: 'ফর্ম ৬ ও ৮' },
  },
  'srv-certificates': {
    en: { label: 'Income / Birth', sub: 'Caste & Domicile' },
    hi: { label: 'प्रमाण पत्र', sub: 'जन्म / आय / जाति' },
    bn: { label: 'সার্টিফিকেট', sub: 'জন্ম / আয় / জাতি' },
  },
  'srv-eshram-ration': {
    en: { label: 'Ration & e-Shram', sub: 'Card & e-KYC' },
    hi: { label: 'राशन व ई-श्रम', sub: 'कार्ड व e-KYC' },
    bn: { label: 'রেশন ও ই-শ্রম', sub: 'কার্ড ও e-KYC' },
  },
  'srv-aeps-banking': {
    en: { label: 'AEPS Cash & Bank', sub: 'Money Transfer' },
    hi: { label: 'AEPS व बैंक', sub: 'नकद व ट्रांसफर' },
    bn: { label: 'AEPS ও ব্যাংক', sub: 'নগদ ও ট্রান্সফার' },
  },
  'srv-pm-kisan': {
    en: { label: 'PM Kisan', sub: 'e-KYC & Status' },
    hi: { label: 'पीएम किसान', sub: 'e-KYC व किस्त' },
    bn: { label: 'পিএম কিষাণ', sub: 'e-KYC ও কিস্তি' },
  },
  'srv-ayushman-bharat': {
    en: { label: 'Ayushman Card', sub: 'Golden Card' },
    hi: { label: 'आयुष्मान कार्ड', sub: 'गोल्डन कार्ड' },
    bn: { label: 'আয়ুষ্মান কার্ড', sub: 'গোল্ডেন কার্ড' },
  },
  'srv-govt-job': {
    en: { label: 'Govt Job Form', sub: 'SSC / Railway' },
    hi: { label: 'सरकारी नौकरी', sub: 'SSC / रेलवे फॉर्म' },
    bn: { label: 'সরকারি চাকরি', sub: 'SSC / রেল ফর্ম' },
  },
  'srv-irctc-flight': {
    en: { label: 'Train & Flight', sub: 'IRCTC Booking' },
    hi: { label: 'ट्रेन व फ्लाइट', sub: 'IRCTC बुकिंग' },
    bn: { label: 'ট্রেন ও ফ্লাইট', sub: 'IRCTC বুকিং' },
  },
};

export const CATEGORY_TRANSLATIONS: Record<
  ServiceCategoryKey,
  Record<AppLanguage, { title: string; subtitle: string }>
> = {
  identity_certificates: {
    en: {
      title: 'Identity & Certificates',
      subtitle: 'Aadhaar, PAN, Voter ID, Birth/Death/Income/Caste/Domicile, e-Shram & Ration Card',
    },
    hi: {
      title: 'पहचान और प्रमाण पत्र',
      subtitle: 'आधार, पैन, वोटर आईडी, जन्म/मृत्यु/आय/जाति/निवास, ई-श्रम और राशन कार्ड',
    },
    bn: {
      title: 'পরিচয়পত্র ও সার্টিফিকেট',
      subtitle: 'আধার, প্যান, ভোটার আইডি, জন্ম/মৃত্যু/আয়/জাতি/বাসস্থান, ই-শ্রম ও রেশন কার্ড',
    },
  },
  banking_finance: {
    en: {
      title: 'Banking & Financial Services',
      subtitle: 'Account Opening, AEPS, Micro ATM, Jeevan Pramaan, Insurance, Pension, ITR & GST',
    },
    hi: {
      title: 'बैंकिंग और वित्तीय सेवाएं',
      subtitle: 'बैंक खाता, AEPS, माइक्रो एटीएम, जीवन प्रमाण, बीमा, पेंशन, ITR और GST',
    },
    bn: {
      title: 'ব্যাংকিং ও আর্থিক পরিষেবা',
      subtitle: 'অ্যাকাউন্ট খোলা, AEPS, মাইক্রো এটিএম, জীবন প্রমাণ, বিমা, পেনশন, ITR ও GST',
    },
  },
  govt_schemes: {
    en: {
      title: 'Government Schemes',
      subtitle: 'PM Kisan, Ayushman Bharat Golden Card, PM Awas Yojana, Tele-Law & Tele-Medicine',
    },
    hi: {
      title: 'सरकारी योजनाएं',
      subtitle: 'पीएम किसान, आयुष्मान भारत गोल्डन कार्ड, पीएम आवास योजना, टेली-लॉ व टेली-मेडिसिन',
    },
    bn: {
      title: 'সরকারি প্রকল্পসমূহ',
      subtitle: 'পিএম কিষাণ, আয়ুষ্মান ভারত গোল্ডেন কার্ড, পিএম আবাস যোজনা, টেলি-ল ও টেলি-মেডিসিন',
    },
  },
  education_jobs: {
    en: {
      title: 'Education & Jobs',
      subtitle: 'Government Job Forms, Exam Forms, NIOS & IGNOU Registration, Scholarship Portals',
    },
    hi: {
      title: 'शिक्षा और रोजगार',
      subtitle: 'सरकारी नौकरी फॉर्म, परीक्षा फॉर्म, NIOS व IGNOU पंजीकरण, छात्रवृत्ति पोर्टल',
    },
    bn: {
      title: 'শিক্ষা ও কর্মসংস্থান',
      subtitle: 'সরকারি চাকরির ফর্ম, পরীক্ষার ফর্ম, NIOS ও IGNOU রেজিস্ট্রেশন, স্কলারশিপ পোর্টাল',
    },
  },
  business_travel: {
    en: {
      title: 'Business, Travel & Other Services',
      subtitle: 'FSSAI License, MSME Udyam, IRCTC Train & Flight Tickets, Land Records ROR, DSC',
    },
    hi: {
      title: 'व्यापार, यात्रा और अन्य सेवाएं',
      subtitle: 'FSSAI लाइसेंस, MSME उद्यम, IRCTC ट्रेन व फ्लाइट टिकट, भूमि अभिलेख, DSC',
    },
    bn: {
      title: 'ব্যবসা, ভ্রমণ ও অন্যান্য পরিষেবা',
      subtitle: 'FSSAI লাইসেন্স, MSME উদ্যম, IRCTC ট্রেন ও ফ্লাইট টিকিট, জমির রেকর্ড, DSC',
    },
  },
};

export const SERVICE_TRANSLATIONS: Record<
  string,
  { hi?: { name: string; desc: string }; bn?: { name: string; desc: string } }
> = {
  'srv-aadhaar': {
    hi: {
      name: 'आधार कार्ड (नामांकन, अपडेट और मोबाइल/पता लिंक)',
      desc: 'नया आधार नामांकन, नाम/पता सुधार या मोबाइल नंबर लिंक सहायता।',
    },
    bn: {
      name: 'আধার কার্ড (এনরোলমেন্ট, আপডেট ও মোবাইল/ঠিকানা লিংক)',
      desc: 'নতুন আধার এনরোলমেন্ট, নাম/ঠিকানা সংশোধন অথবা মোবাইল নম্বর লিংক সহায়তা।',
    },
  },
  'srv-pan': {
    hi: {
      name: 'पैन कार्ड (नया आवेदन और सुधार)',
      desc: 'नया NSDL/UTIITSL पैन कार्ड आवेदन, नाम/जन्मतिथि सुधार या रीप्रिंट।',
    },
    bn: {
      name: 'প্যান কার্ড (নতুন আবেদন ও সংশোধন)',
      desc: 'নতুন NSDL/UTIITSL প্যান কার্ড আবেদন, নাম/জন্মতারিখ সংশোধন বা রিপ্রিন্ট।',
    },
  },
  'srv-voter-id': {
    hi: {
      name: 'मतदाता पहचान पत्र (Voter ID - नया/सुधार)',
      desc: 'नया वोटर आईडी (फॉर्म-6), पता बदलाव या EPIC कार्ड सुधार (फॉर्म-8)।',
    },
    bn: {
      name: 'ভোটার পরিচয়পত্র (নতুন ফর্ম-৬ / সংশোধন ফর্ম-৮)',
      desc: 'নতুন ভোটার কার্ড আবেদন (ফর্ম-৬), ঠিকানা পরিবর্তন বা EPIC কার্ড সংশোধন (ফর্ম-৮)।',
    },
  },
  'srv-certificates': {
    hi: {
      name: 'जन्म, मृत्यु, आय, जाति और निवास प्रमाण पत्र',
      desc: 'राजस्व/नगर निगम/पंचायत से जारी होने वाले प्रमाण पत्रों का ऑनलाइन आवेदन।',
    },
    bn: {
      name: 'জন্ম, মৃত্যু, আয়, জাতি ও বাসস্থান সার্টিফিকেট',
      desc: 'পঞ্চায়েত/পুরসভা/তহসিল থেকে সরকারি সার্টিফিকেটের অনলাইন আবেদন ও ফাইলিং।',
    },
  },
  'srv-eshram-ration': {
    hi: {
      name: 'ई-श्रम (e-Shram) कार्ड और राशन कार्ड सेवाएं',
      desc: 'नया ई-श्रम UAN कार्ड पंजीकरण, राशन कार्ड आवेदन, सदस्य जोड़ना व e-KYC।',
    },
    bn: {
      name: 'ই-শ্রম (e-Shram) কার্ড ও রেশন কার্ড পরিষেবা',
      desc: 'নতুন ই-শ্রম UAN কার্ড নিবন্ধন, রেশন কার্ড আবেদন, সদস্য যোগ ও e-KYC।',
    },
  },
  'srv-aeps-banking': {
    hi: {
      name: 'बैंक खाता खोलना, नकद निकासी (AEPS) और मनी ट्रांसफर',
      desc: 'बचत खाता सहायता, आधार द्वारा नकद निकासी व जमा और DMT मनी ट्रांसफर।',
    },
    bn: {
      name: 'ব্যাংক অ্যাকাউন্ট খোলা, নগদ তোলা (AEPS) ও মানি ট্রান্সফার',
      desc: 'সেভিংস অ্যাকাউন্ট সহায়তা, আধার ভিত্তিক নগদ লেনদেন এবং DMT মানি ট্রান্সফার।',
    },
  },
  'srv-micro-atm': {
    hi: {
      name: 'माइक्रो एटीएम (Micro ATM) कार्ड सेवाएं',
      desc: 'डेबिट कार्ड स्वाइप से तुरंत नकद निकासी, बैलेंस जांच और मिनी स्टेटमेंट।',
    },
    bn: {
      name: 'মাইক্রো এটিএম (Micro ATM) কার্ড পরিষেবা',
      desc: 'ডেবিট কার্ডের মাধ্যমে তাৎক্ষণিক নগদ উত্তোলন, ব্যালেন্স চেক ও মিনি স্টেটমেন্ট।',
    },
  },
  'srv-jeevan-pramaan': {
    hi: {
      name: 'जीवन प्रमाण (पेंशनभोगी जीवन प्रमाण पत्र)',
      desc: 'वरिष्ठ नागरिकों व पेंशनभोगियों के लिए बायोमेट्रिक डिजिटल जीवन प्रमाण पत्र।',
    },
    bn: {
      name: 'জীবন প্রমাণ (পেনশনভোগীদের লাইফ সার্টিফিকেট)',
      desc: 'প্রবীণ নাগরিক ও পেনশনভোগীদের জন্য বায়োমেট্রিক ডিজিটাল লাইফ সার্টিফিকেট।',
    },
  },
  'srv-insurance-pension': {
    hi: {
      name: 'बीमा (Insurance) और पेंशन योजनाएं (PM-SYM, NPS, APY)',
      desc: 'अटल पेंशन योजना, NPS, PM-SYM, PMJJBY, PMSBY और वाहन/स्वास्थ्य बीमा।',
    },
    bn: {
      name: 'বিমা (Insurance) ও পেনশন প্রকল্প (PM-SYM, NPS, APY)',
      desc: 'অটল পেনশন যোজনা, NPS, PM-SYM, জীবন/স্বাস্থ্য বিমা এবং যানবাহন ইনস্যুরেন্স।',
    },
  },
  'srv-itr-gst': {
    hi: {
      name: 'आयकर (Income Tax) फाइलिंग और GST सेवाएं',
      desc: 'ITR ई-फाइलिंग, नया GST पंजीकरण, मासिक/त्रैमासिक GST रिटर्न फाइलिंग।',
    },
    bn: {
      name: 'আয়কর (ITR) ফাইলিং ও GST পরিষেবা',
      desc: 'আয়কর রিটার্ন ই-ফাইলিং, নতুন GST রেজিস্ট্রেশন ও GST রিটার্ন দাখিল।',
    },
  },
  'srv-pm-kisan': {
    hi: {
      name: 'पीएम किसान सम्मान निधि (PM Kisan)',
      desc: 'नया किसान पंजीकरण, e-KYC सत्यापन, भूमि सीडिंग व किस्त स्थिति जांच।',
    },
    bn: {
      name: 'পিএম কিষাণ সম্মান নিধি (নতুন, e-KYC ও স্ট্যাটাস)',
      desc: 'নতুন কৃষক নিবন্ধন, e-KYC সম্পূর্ণ করা, জমির সিডিং ও কিস্তির স্ট্যাটাস চেক।',
    },
  },
  'srv-ayushman-bharat': {
    hi: {
      name: 'आयुष्मान भारत / गोल्डन कार्ड (PM-JAY)',
      desc: 'पात्रता जांच, परिवार e-KYC और ₹5 लाख स्वास्थ्य बीमा गोल्डन कार्ड डाउनलोड।',
    },
    bn: {
      name: 'আয়ুষ্মান ভারত / গোল্ডেন কার্ড (PM-JAY)',
      desc: 'যোগ্যতা যাচাই, পরিবারের e-KYC এবং ₹৫ লক্ষ স্বাস্থ্য বিমা গোল্ডেন কার্ড ডাউনলোড।',
    },
  },
  'srv-pmay': {
    hi: {
      name: 'प्रधानमंत्री आवास योजना (PMAY शहरी / ग्रामीण)',
      desc: 'आवास योजना आवेदन, दस्तावेज़ जांच व लाभार्थी सूची स्थिति जांच।',
    },
    bn: {
      name: 'প্রধানমন্ত্রী আবাস যোজনা (PMAY শহর / গ্রামীণ)',
      desc: 'আবাস যোজনা আবেদন ফাইলিং, নথি যাচাই ও সুবিধাভোগী তালিকা স্ট্যাটাস।',
    },
  },
  'srv-tele-law-med': {
    hi: {
      name: 'टेली-लॉ (Tele-Law) और टेली-मेडिसिन (Tele-Medicine)',
      desc: 'वकीलों से ऑनलाइन कानूनी सलाह व डॉक्टर से टेली-मेडिसिन परामर्श बुकिंग।',
    },
    bn: {
      name: 'টেলি-ল (আইনি পরামর্শ) ও টেলি-মেডিসিন (ডাক্তারি পরামর্শ)',
      desc: 'অভিজ্ঞ আইনজীবীর সাথে আইনি পরামর্শ ও ডাক্তারের সাথে অনলাইন পরামর্শ বুকিং।',
    },
  },
  'srv-govt-job': {
    hi: {
      name: 'सरकारी नौकरी (Govt Job) ऑनलाइन आवेदन',
      desc: 'SSC, UPSC, रेलवे, पुलिस, TET और राज्य सरकार की भर्तियों का सटीक फॉर्म व फोटो/सिग्नेचर सेटअप।',
    },
    bn: {
      name: 'সরকারি চাকরির অনলাইন আবেদন (SSC, UPSC, রেল, রাজ্য)',
      desc: 'SSC, UPSC, রেলওয়ে, পুলিশ, TET ও রাজ্যের চাকরির ফর্ম পূরণ ও ছবি/স্বাক্ষর সেটআপ।',
    },
  },
  'srv-exam-nios-ignou': {
    hi: {
      name: 'परीक्षा फॉर्म, NIOS और IGNOU पंजीकरण',
      desc: 'NIOS 10वीं/12वीं एडमिशन, IGNOU पंजीकरण, परीक्षा फॉर्म और प्रवेश पत्र सेवा।',
    },
    bn: {
      name: 'পরীক্ষার ফর্ম, NIOS ও IGNOU রেজিস্ট্রেশন / অ্যাসাইনমেন্ট',
      desc: 'NIOS মাধ্যমিক/উচ্চমাধ্যমিক ভর্তি, IGNOU রেজিস্ট্রেশন, পরীক্ষার ফর্ম ও অ্যাডমিট কার্ড।',
    },
  },
  'srv-scholarship': {
    hi: {
      name: 'छात्रवृत्ति (Scholarship) पंजीकरण',
      desc: 'राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) और राज्य स्तरीय पोस्ट-मैट्रिक छात्रवृत्ति आवेदन व नवीनीकरण।',
    },
    bn: {
      name: 'স্কলারশিপ রেজিস্ট্রেশন (NSP ও রাজ্য পোর্টাল)',
      desc: 'জাতীয় স্কলারশিপ পোর্টাল (NSP), ঐক্যশ্রী, স্বামী বিবেকানন্দ ও পোস্ট-ম্যাট্রিক স্কলারশিপ আবেদন।',
    },
  },
  'srv-fssai-msme': {
    hi: {
      name: 'FSSAI (FoSCoS) लाइसेंस और MSME पंजीकरण',
      desc: 'खाद्य व्यवसाय FSSAI बेसिक/स्टेट लाइसेंस और MSME उद्यम आधार प्रमाण पत्र।',
    },
    bn: {
      name: 'FSSAI ফুড লাইসেন্স ও MSME উদ্যম রেজিস্ট্রেশন',
      desc: 'খাদ্য ব্যবসার FSSAI লাইসেন্স (FoSCoS) এবং MSME উদ্যম রেজিস্ট্রেশন সার্টিফিকেট।',
    },
  },
  'srv-irctc-flight': {
    hi: {
      name: 'IRCTC ट्रेन और फ्लाइट टिकट बुकिंग',
      desc: 'कन्फर्म IRCTC रेल ई-टिकट, तत्काल बुकिंग सहायता और घरेलू/अंतर्राष्ट्रीय फ्लाइट टिकट।',
    },
    bn: {
      name: 'IRCTC ট্রেন ও ফ্লাইট টিকিট বুকিং',
      desc: 'কনফার্ম IRCTC রেল ই-টিকিট, তৎকাল বুকিং সহায়তা এবং দেশ-বিদেশের ফ্লাইট টিকিট।',
    },
  },
  'srv-land-records': {
    hi: {
      name: 'भूमि अभिलेख (Land Records / Banglarbhumi ROR)',
      desc: 'बांगलारभूमि खतियान/दाग ROR प्रति, भू-राजस्व रसीद, म्यूटेशन और पर्चा/मैप सेवाएं।',
    },
    bn: {
      name: 'জমির রেকর্ড / বাংলারভূমি ROR, পর্চা ও মিউটেশন',
      desc: 'বাংলারভূমি খতিয়ান/দাগ ROR কপি, খাজনা রসিদ, মিউটেশন ও প্লট ম্যাপ পরিষেবা।',
    },
  },
  'srv-dsc': {
    hi: {
      name: 'डिजिटल हस्ताक्षर (Class-3 Digital Signature - DSC)',
      desc: 'ई-टेंडर, GST, MCA और इनकम टैक्स के लिए Class-3 DSC एवं USB टोकन जारी करना।',
    },
    bn: {
      name: 'ডিজিটাল স্বাক্ষর (Class-3 DSC ও USB টোকেন)',
      desc: 'ই-টেন্ডার, GST, MCA এবং আয়কর ফাইলিংয়ের জন্য Class-3 ডিজিটাল সিগনেচার ও টোকেন।',
    },
  },
};

export const DOC_NAME_TRANSLATIONS: Record<string, { hi: string; bn: string }> = {
  'Proof of Identity': { hi: 'पहचान का प्रमाण (Proof of Identity)', bn: 'পরিচয়ের প্রমাণ (Proof of Identity)' },
  'Proof of Address': { hi: 'पते का प्रमाण (Proof of Address)', bn: 'ঠিকানার প্রমাণ (Proof of Address)' },
  'Proof of Birth': { hi: 'जन्म का प्रमाण (Proof of Birth)', bn: 'জন্মের প্রমাণ (Proof of Birth)' },
  'Proof of Nationality': { hi: 'राष्ट्रीयता का प्रमाण (Proof of Nationality)', bn: 'জাতীয়তার প্রমাণ (Proof of Nationality)' },
  'Proof of Disability': { hi: 'दिव्यांगता प्रमाण पत्र (Proof of Disability)', bn: 'প্রতিবন্ধকতার প্রমাণ (Proof of Disability)' },
  'Proof of Caste': { hi: 'जाति प्रमाण पत्र (Proof of Caste)', bn: 'জাতিগত প্রমাণ (Proof of Caste)' },
  'Proof of Income': { hi: 'आय प्रमाण पत्र (Proof of Income)', bn: 'আয়ের প্রমাণ (Proof of Income)' },
  'Proof of Residence': { hi: 'निवास प्रमाण पत्र (Proof of Residence)', bn: 'বাসস্থানের প্রমাণ (Proof of Residence)' },
  'Proof of National Card': { hi: 'राष्ट्रीय कार्ड प्रमाण (Proof of National Card)', bn: 'জাতীয় কার্ডের প্রমাণ (Proof of National Card)' },
  'Applicant Photo (Max 1 MB)': { hi: 'आवेदक का फोटो (अधिकतम 1 MB)', bn: 'আবেদনকারীর ছবি (সর্বোচ্চ ১ MB)' },
  'Applicant Signature (Max 1 MB)': { hi: 'आवेदक के हस्ताक्षर (अधिकतम 1 MB)', bn: 'আবেদনকারীর স্বাক্ষর (সর্বোচ্চ ১ MB)' },
  'Other Document 1 (Optional)': { hi: 'अन्य दस्तावेज़ 1 (वैकल्पिक)', bn: 'অন্যান্য নথি ১ (ঐচ্ছিক)' },
  'Other Document 2 (Optional)': { hi: 'अन्य दस्तावेज़ 2 (वैकल्पिक)', bn: 'অন্যান্য নথি ২ (ঐচ্ছিক)' },
};

export function getLocalizedService(srv: ServicePackage, lang: AppLanguage): { name: string; description: string } {
  if (lang === 'en') {
    return { name: srv.name, description: srv.description };
  }
  const entry = SERVICE_TRANSLATIONS[srv.id];
  if (lang === 'hi') {
    return {
      name: entry?.hi?.name || srv.nameHi || srv.name,
      description: entry?.hi?.desc || srv.description,
    };
  }
  return {
    name: entry?.bn?.name || srv.name,
    description: entry?.bn?.desc || srv.description,
  };
}

export function getLocalizedDocName(docName: string, lang: AppLanguage): string {
  if (lang === 'en') return docName;
  const entry = DOC_NAME_TRANSLATIONS[docName];
  if (!entry) return docName;
  return lang === 'hi' ? entry.hi : entry.bn;
}

// ============================================
// GovChain Platform - English / Tamil Dictionary
// ============================================

export type Language = 'en' | 'ta';

export const translations = {
  en: {
    appName: 'GovChain',
    tagline: 'Civic Transparency & Public Accountability Portal',
    navHome: 'Home',
    navIssues: 'Civic Map & Reports',
    navReport: 'Report Problem',
    navChat: 'AI Civic Assistant',
    navTrack: 'Track Status',
    navTransparency: 'Public Transparency',
    navDashboard: 'Dashboard',
    navLogin: 'Login',
    navRegister: 'Register',
    navLogout: 'Sign Out',
    roleCitizen: 'Citizen',
    roleOfficial: 'Government Official',
    roleModerator: 'Civic Moderator',
    roleAdmin: 'Administrator',

    // Hero & Home
    heroTitle: 'Empowering Citizens, Verifying Governance',
    heroSubtitle: 'Report civic issues, track public works, inspect budgets, and vote on local initiatives with tamper-evident cryptographic transparency.',
    btnReportNow: 'Report an Issue',
    btnExploreMap: 'Browse Map',
    btnAiIntake: 'AI Chat Intake',
    btnVerifyAudit: 'Verify Audit Ledger',

    // Statuses
    statusDraft: 'Draft',
    statusSubmitted: 'Submitted',
    statusUnderModeration: 'Under Moderation',
    statusPublished: 'Published',
    statusVerified: 'Verified',
    statusAssigned: 'Assigned to Official',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusRejected: 'Rejected',
    statusReopened: 'Reopened',
    statusClosed: 'Closed',

    // Categories
    catRoadDamage: 'Road Damage & Potholes',
    catUnsafeConstruction: 'Unsafe Construction',
    catWaterSupply: 'Water Supply Issue',
    catDrainage: 'Drainage & Sewage Overflow',
    catWasteManagement: 'Solid Waste & Garbage',
    catStreetLights: 'Street Lights & Power',
    catTransport: 'Public Transport',
    catPublicFacilities: 'Public Facilities',
    catEducation: 'Education Infrastructure',
    catHealthcare: 'Public Health & Clinics',
    catEnvironment: 'Environment & Pollution',
    catCorruption: 'Anti-Corruption Reporting',
    catNoise: 'Noise Pollution',
    catEncroachment: 'Public Encroachment',
    catOther: 'General Civic Issue',

    // Priorities
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    priorityCritical: 'Critical Safety Hazard',

    // Common Actions
    btnSubmit: 'Submit Report',
    btnCancel: 'Cancel',
    btnSave: 'Save Changes',
    btnSupport: 'Support Issue',
    btnSupported: 'Supported',
    btnAddComment: 'Post Comment',
    btnSearch: 'Search',
    btnFilter: 'Apply Filters',
    btnReset: 'Reset',
    btnShareLocation: 'Use My GPS Location',
    locationApproxNote: 'Locations are publicly generalized to preserve citizen privacy.',
    
    // Disclaimers
    civicDisclaimer: 'GovChain is an independent civic transparency portal designed for community accountability and open governance. Unofficial polls are not legally binding public referendums.',
    aiDisclaimer: 'AI categorization and triage provides heuristic recommendations. All reports are editable and require citizen confirmation before submission.',
    auditNotice: 'Tamper-evident chronological cryptographic ledger maintained via SHA-256 hash chains.',
  },
  ta: {
    appName: 'கவ்செயின் (GovChain)',
    tagline: 'குடிமக்கள் வெளிப்படைத்தன்மை மற்றும் பொது பொறுப்புடைமை தளம்',
    navHome: 'முகப்பு',
    navIssues: 'குடிமக்கள் வரைபடம் & புகார்கள்',
    navReport: 'புகார் பதிவு செய்க',
    navChat: 'செயற்கை நுண்ணறிவு உதவியாளர்',
    navTrack: 'நிலை கண்காணிப்பு',
    navTransparency: 'பொது வெளிப்படைத்தன்மை',
    navDashboard: 'முகப்பு பலகை',
    navLogin: 'உள்நுழைக',
    navRegister: 'பதிவு செய்க',
    navLogout: 'வெளியேறு',
    roleCitizen: 'குடிமகன்',
    roleOfficial: 'அரசு அலுவலர்',
    roleModerator: 'மதிப்பாய்வாளர்',
    roleAdmin: 'நிர்வாகி',

    // Hero & Home
    heroTitle: 'குடிமக்களை வலுப்படுத்துதல், ஆட்சியை உறுதிப்படுத்துதல்',
    heroSubtitle: 'சாலை சேதங்கள், கழிவுநீர், குடிநீர் பிரச்சனைகளை பதிவு செய்து, வெளிப்படையான வரவு செலவு கணக்குகள் மற்றும் திட்டங்களை கண்காணிக்கவும்.',
    btnReportNow: 'புகார் பதிவு செய்க',
    btnExploreMap: 'வரைபடத்தில் பார்க்க',
    btnAiIntake: 'AI உரையாடல் மூலம் பதிவு',
    btnVerifyAudit: 'தணிக்கை சங்கிலியை சரிபார்க்கவும்',

    // Statuses
    statusDraft: 'வரைவு',
    statusSubmitted: 'சமர்ப்பிக்கப்பட்டது',
    statusUnderModeration: 'மதிப்பாய்வில் உள்ளது',
    statusPublished: 'வெளியிடப்பட்டது',
    statusVerified: 'சரிபார்க்கப்பட்டது',
    statusAssigned: 'அலுவலருக்கு ஒதுக்கப்பட்டது',
    statusInProgress: 'பணி நடக்கிறது',
    statusResolved: 'தீர்க்கப்பட்டது',
    statusRejected: 'நிராகரிக்கப்பட்டது',
    statusReopened: 'மீண்டும் திறக்கப்பட்டது',
    statusClosed: 'முடிக்கப்பட்டது',

    // Categories
    catRoadDamage: 'சாலை சேதம் & பள்ளங்கள்',
    catUnsafeConstruction: 'பாதுகாப்பற்ற கட்டடம்',
    catWaterSupply: 'குடிநீர் விநியோகப் பிரச்சனை',
    catDrainage: 'கழிவுநீர் வடிகால் அடைப்பு',
    catWasteManagement: 'திடக்கழிவு & குப்பை',
    catStreetLights: 'தெருவிளக்கு பழுது',
    catTransport: 'பொது போக்குவரத்து',
    catPublicFacilities: 'பொது வசதிகள்',
    catEducation: 'கல்வி உள்கட்டமைப்பு',
    catHealthcare: 'பொது சுகாதாரம் & மருத்துவமனை',
    catEnvironment: 'சுற்றுச்சூழல் & மாசுபாடு',
    catCorruption: 'ஊழல் புகார்',
    catNoise: 'ஒலி மாசுபாடு',
    catEncroachment: 'ஆக்கிரமிப்பு',
    catOther: 'பொதுவான குடிமக்கள் பிரச்சனை',

    // Priorities
    priorityLow: 'குறைந்த முன்னுரிமை',
    priorityMedium: 'நடுத்தர முன்னுரிமை',
    priorityHigh: 'அதிக முன்னுரிமை',
    priorityCritical: 'அவசர ஆபத்து (உடனடி நடவடிக்கை)',

    // Common Actions
    btnSubmit: 'சமர்ப்பிக்கவும்',
    btnCancel: 'ரத்து செய்',
    btnSave: 'சேமிக்க',
    btnSupport: 'ஆதரவு தெரிவிக்க',
    btnSupported: 'ஆதரிக்கப்பட்டது',
    btnAddComment: 'கருத்து பதிவிடுக',
    btnSearch: 'தேடுக',
    btnFilter: 'வடிகட்டுக',
    btnReset: 'மீட்டமைக்க',
    btnShareLocation: 'எனது ஜி.பி.எஸ் இருப்பிடத்தை பயன்படுத்துக',
    locationApproxNote: 'குடிமக்கள் தனியுரிமையை பாதுகாக்க இருப்பிடம் தோராயமாக மட்டுமே காட்டப்படுகிறது.',

    // Disclaimers
    civicDisclaimer: 'கவ்செயின் (GovChain) என்பது குடிமக்கள் பொறுப்புடைமைக்கான ஒரு சுதந்திரமான வெளிப்படைத்தன்மை தளம் ஆகும்.',
    aiDisclaimer: 'செயற்கை நுண்ணறிவு பரிந்துரைகள் வழிகாட்டுதலுக்கு மட்டுமே. உறுதி செய்வதற்கு முன் அனைத்து விவரங்களையும் சரிபார்க்கவும்.',
    auditNotice: 'SHA-256 கிரிப்டோகிராஃபிக் ஹாஷ் சங்கிலி மூலம் பாதுகாக்கப்பட்ட தணிக்கை பதிவு.',
  },
};

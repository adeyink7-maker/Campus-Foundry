/**
 * CAMPUS REFERENCE DATA (UNVERIFIED - HELD FOR ADMIN CONFIRMATION)
 * 
 * TODO: Confirm all items below with UNILORIN administration, SUG executive committee,
 * departmental course representatives, and campus transport union before moving into
 * active database tables. Leave unused in the UI until verified.
 */

import {
  PoliticalCandidate,
  CampusNewsArticle,
  DepartmentResource,
  ShuttleRoute,
  CampusLandmark
} from '../types';

// TODO: Verify official 2026/2027 SUG and Faculty election candidates with UNECOM
export const REFERENCE_POLITICAL_CANDIDATES: PoliticalCandidate[] = [
  {
    id: 'cand-danladi',
    name: 'Hon. Ibrahim Danladi (Dan-Law)',
    runningFor: 'SUG President (CEC)',
    session: '2026/2027 Session',
    faculty: 'Faculty of Law',
    department: 'Public Law',
    level: '400L',
    matricOrSlug: 'danladi-president',
    slogan: 'Vision 360: Equity, 24/7 Digital Hubs & Regulated Fares',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    manifestoSummary: 'Championing fair transport fares across Permanent Site & Tanke, expansion of high-speed WiFi coverage to Village IV & V hostels, and open SUG budgetary disclosures.',
    manifestoPillars: [
      {
        title: '1. Regulated Campus Transportation & Shuttle Pricing',
        description: 'Negotiate strict ₦150 maximum shuttle cap with the Tanke Transport Union and deploy student marshals at Tipper Garage.'
      },
      {
        title: '2. 24/7 CBT & Hostel WiFi Expansion',
        description: 'Collaborate with COMSIT to install outdoor solar-powered WiFi antennas across Village I-V quads and private hostel junctions.'
      },
      {
        title: '3. Transparent Student Union Welfare Budgeting',
        description: 'Publish quarterly digital expense breakdowns accessible to all matriculated Unilorites on Campus Foundry.'
      }
    ],
    endorsementsCount: 0,
    endorsedByMe: false,
    campaignUpdates: [],
    contacts: {
      whatsapp: '2348012345678',
      twitter: '@DanLaw_UNILORIN',
      instagram: '@danlaw_sug'
    }
  },
  {
    id: 'cand-adesua',
    name: 'Adesua Omotayo (Empress)',
    runningFor: 'SUG Vice President (CEC)',
    session: '2026/2027 Session',
    faculty: 'Faculty of Clinical Sciences',
    department: 'Nursing Science',
    level: '400L',
    matricOrSlug: 'adesua-vp',
    slogan: 'Empower, Educate & Elevate: A Compassionate Voice for All',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    manifestoSummary: 'Dedicated to student mental health, female sanitary hygiene dispensers across female halls (Village II-V, Robiat Ajike), academic tutorial clinics for 100L students, and cultural inclusion.',
    manifestoPillars: [
      {
        title: '1. Free Sanitary & Wellness Dispensers',
        description: 'Install emergency sanitary care stations across all female hostels and lecture halls in permanent site and mini campus.'
      },
      {
        title: '2. Fresher Mentorship & GNS Tutorial Clinics',
        description: 'Organize high-impact weekly revision sessions run by departmental best graduating scholars for freshmen tackling 100L GNS courses.'
      },
      {
        title: '3. Mental Health Peer Helpline',
        description: 'Establish an anonymous peer counselor chatline in collaboration with the Department of Psychology and Guidance & Counseling Unit.'
      }
    ],
    endorsementsCount: 0,
    endorsedByMe: false,
    campaignUpdates: [],
    contacts: {
      whatsapp: '2348123456789',
      twitter: '@Adesua_Empress',
      instagram: '@empress_adesua'
    }
  },
  {
    id: 'cand-femi',
    name: 'Femi Adebisi (CodeMaster)',
    runningFor: 'NACOS President (CIS Faculty)',
    session: '2026/2027 Session',
    faculty: 'Faculty of Communication and Information Sciences (CIS)',
    department: 'Computer Science',
    level: '300L',
    matricOrSlug: 'femi-nacos',
    slogan: 'Tech Innovation, SIWES Placement & Global Hackathons',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    manifestoSummary: 'Elevating NACOS into Nigeria’s leading collegiate computing association with direct internship pipelines to leading tech employers.',
    manifestoPillars: [
      {
        title: '1. Direct Tech Internship & SIWES Pipeline',
        description: 'Sign hiring partnership agreements with 20+ Lagos and international fintechs for guaranteed 300L/400L student placements.'
      },
      {
        title: '2. Annual UNILORIN Hackathon & ₦2,000,000 Prize Pool',
        description: 'Host the premier campus innovation sprint bringing venture capitalists and angel investors directly to the CIS Auditorium.'
      },
      {
        title: '3. Cloud & GitHub Pro Certification Subsidies',
        description: 'Sponsor AWS, Google Cloud, and Azure certification exam vouchers for top-performing departmental programmers.'
      }
    ],
    endorsementsCount: 0,
    endorsedByMe: false,
    campaignUpdates: [],
    contacts: {
      whatsapp: '2348098765432',
      twitter: '@FemiCode_UNILORIN'
    }
  }
];

// TODO: Verify official goodwill notices with student election candidates
export const REFERENCE_POLITICAL_FELICITATIONS = [
  {
    id: 'fel-1',
    candidateName: 'Hon. Ibrahim Danladi (Dan-Law)',
    runningFor: 'SUG President (CEC)',
    bannerText: 'Wishing all UNILORIN Stalwarts, Freshers & Scholars a successful CBT & Harmattan Examination Session! Stay focused, stay resolute.',
    tag: 'Official Goodwill Message',
    date: 'Oct 4, 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fel-2',
    candidateName: 'Adesua Omotayo (Empress)',
    runningFor: 'SUG Vice President (CEC)',
    bannerText: 'Warm felicitations to all Unilorites on Academic Excellence Week! Remember to utilize the peer tutorial clinics at Village I & II quads.',
    tag: 'Welfare & Academic Felicitations',
    date: 'Oct 3, 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fel-3',
    candidateName: 'Femi Adebisi (CodeMaster)',
    runningFor: 'NACOS President (CIS Faculty)',
    bannerText: 'Cheers to all CIS coders, designers, and innovators gearing up for the 2026 Hackathon sprint! Code clean, compile first try.',
    tag: 'Tech Community Greetings',
    date: 'Oct 1, 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  },
];

// TODO: Verify with Directorate of Corporate Affairs before publishing campus bulletins
export const REFERENCE_CAMPUS_NEWS: CampusNewsArticle[] = [
  {
    id: 'news-harmattan-exams',
    title: 'UNILORIN Senate Approves Harmonized Harmattan Semester CBT & Written Exam Timetable',
    slug: 'unilorin-senate-harmattan-exam-schedule',
    category: 'Exams & CBT',
    summary: 'The University Senate at its 294th statutory meeting has ratified the final examination timetable. 100L and 200L General Studies (GNS) CBT tests commence on Monday at the CBT Centre.',
    content: `The Management of the University of Ilorin (UNILORIN) wishes to inform all students, faculty members, and the university community that the revised timetable for the Harmattan Semester Examinations has been officially approved.`,
    publishedAt: 'October 3, 2026',
    author: 'Directorate of Corporate Affairs',
    authorRole: 'Official University Senate Bulletin',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    readTime: '3 min read',
    isBreaking: true,
    pinned: true,
  },
  {
    id: 'news-wifi-upgrade',
    title: 'University Upgrades Fiber Optic Backbone: High-Speed Academic WiFi Deployed Across Hostels & Lecture Theatres',
    slug: 'unilorin-fiber-optic-wifi-upgrade',
    category: 'Senate & Admin',
    summary: 'The Information and Communication Technology (COMSIT) Directorate has completed phase two of the campus fiber optic loop, delivering 10Gbps connectivity across permanent site hostels and academic complexes.',
    content: `In line with the Vice-Chancellor’s vision for a world-class smart campus, COMSIT has installed 120 enterprise wireless access points covering Village I, Village II, Abuja, Kwara, and Zamfara hostels.`,
    publishedAt: 'October 1, 2026',
    author: 'COMSIT Directorate',
    authorRole: 'Technical Bulletin',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    readTime: '2 min read',
    isBreaking: false,
    pinned: false,
  }
];

// TODO: Verify course materials with faculty course representatives before re-enabling downloads
export const REFERENCE_DEPARTMENT_RESOURCES: DepartmentResource[] = [
  {
    id: 'res-gns111',
    title: 'GNS 111: Use of English & Communication Skills Comprehensive CBT Bank',
    courseCode: 'GNS 111',
    faculty: 'General Studies Unit',
    department: 'All Departments',
    level: '100L',
    category: 'GNS & Orientation',
    description: 'CBT practice questions covering Lexis & Structure, Concord, Antonyms/Synonyms, and Sentence Diagramming with answer explanations.',
    fileType: 'PDF',
    uploadedBy: 'General Studies Scholar Circle',
    downloadsCount: 0,
    date: 'Harmattan 2026',
    tags: ['GNS 111', 'Use of English', '100L CBT', 'Past Questions']
  },
  {
    id: 'res-gns112',
    title: 'GNS 112: Citizenship & Nigerian History CBT Revision Flashcards',
    courseCode: 'GNS 112',
    faculty: 'General Studies Unit',
    department: 'All Departments',
    level: '100L',
    category: 'GNS & Orientation',
    description: 'Summary tables of historical constitutional conferences and fundamental human rights clauses for rapid CBT scoring.',
    fileType: 'PDF',
    uploadedBy: 'History & Civics Society',
    downloadsCount: 0,
    date: 'Harmattan 2026',
    tags: ['GNS 112', 'Citizenship', 'History', 'CBT Revision']
  }
];

// TODO: Verify with UNILORIN Transport Committee and Tanke Park union before displaying routes/fares
export const REFERENCE_SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: 'route-ps-tanke',
    routeName: 'Permanent Site (PS) Terminal ⇄ Tanke Sanrab Gate',
    from: 'PS Bus Terminal (University Park)',
    to: 'Tanke Junction / Tipper Garage',
    fare: 150,
    frequencyMinutes: '3 - 5 mins',
    operatingHours: '6:30 AM - 9:30 PM',
    status: 'Active High Frequency',
    currentBusesActive: 0
  },
  {
    id: 'route-ps-postoffice',
    routeName: 'Permanent Site (PS) Terminal ⇄ Post Office / Challenge',
    from: 'PS Bus Terminal',
    to: 'Post Office Central Hub',
    fare: 250,
    frequencyMinutes: '8 - 12 mins',
    operatingHours: '6:30 AM - 8:30 PM',
    status: 'Active High Frequency',
    currentBusesActive: 0
  }
];

// TODO: Replace unverified stock photos with authenticated on-ground UNILORIN landmark photographs
export const REFERENCE_CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    id: 'lm-senate',
    name: 'Senate Building & Administrative Tower',
    shortName: 'Senate Building',
    category: 'Administrative',
    zone: 'Permanent Site',
    description: 'The iconic multi-storey administrative epicenter of UNILORIN, housing the Vice-Chancellor’s office, Registrar, Student Affairs, and Academic Planning.',
    popularActivities: ['Student Affairs Inquiries', 'Official Clearances'],
    openingHours: '8:00 AM - 4:00 PM (Weekdays)',
    busStopNear: 'Senate Bus Stop',
    imageUrl: ''
  },
  {
    id: 'lm-cbt',
    name: '500-Seater CBT Examination Complex',
    shortName: 'CBT Complex',
    category: 'Academic Complex',
    zone: 'Permanent Site',
    description: 'State-of-the-art computer-based testing hub with dual auxiliary halls for GNS examinations, POST-UTME, and departmental continuous assessments.',
    popularActivities: ['GNS Examinations', 'Continuous Assessment'],
    openingHours: '7:30 AM - 6:00 PM (Exam Sessions)',
    busStopNear: 'CBT Centre Junction',
    imageUrl: ''
  }
];

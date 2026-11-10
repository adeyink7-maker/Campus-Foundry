import {
  MotivationCard,
  MotivationalQuote,
  CampusPost,
  CampusSnap,
  PoliticalCandidate,
  DepartmentResource,
  CampusClub,
  CampusNewsArticle,
  CampusLandmark,
  ShuttleRoute,
  StudentLevel
} from '../types';

export const BANNER_DATABASE: MotivationCard[] = [
  // POLITICS & SUG PANEL
  {
    id: "mandela_01",
    figureName: "Nelson Mandela",
    figureImageUrl: "/assets/banners/politics/nelson_mandela.jpg",
    quoteText: "Leadership is not about titles, positions, or flowcharts. It is about one life influencing another.",
    domainCategory: "POLITICS",
    backdropThemeCss: "theme-parliamentary",
    authorTitle: "Anti-Apartheid Leader & President of South Africa",
    eraOrContext: "Nobel Peace Prize Laureate & Global Moral Leader",
    categoryBadge: "Statesmanship & Liberty",
    author: "Nelson Mandela",
    quote: "Leadership is not about titles, positions, or flowcharts. It is about one life influencing another.",
    imageUrl: "/assets/banners/politics/nelson_mandela.jpg",
    module: "politics"
  },
  {
    id: "awolowo_01",
    figureName: "Chief Obafemi Awolowo",
    figureImageUrl: "/assets/banners/politics/obafemi_awolowo.jpg",
    quoteText: "The violence of direction is often more effective than the speed of movement. Those who desire to lead must conquer their appetite for ease, slumber, and indulgence.",
    domainCategory: "POLITICS",
    backdropThemeCss: "theme-parliamentary",
    authorTitle: "Premier of Western Region & Statesman",
    eraOrContext: "Architect of Free Universal Education & Modern Governance",
    categoryBadge: "Discipline & Public Service",
    author: "Chief Obafemi Awolowo",
    quote: "The violence of direction is often more effective than the speed of movement. Those who desire to lead must conquer their appetite for ease, slumber, and indulgence.",
    imageUrl: "/assets/banners/politics/obafemi_awolowo.jpg",
    module: "politics"
  },
  {
    id: "sankara_01",
    figureName: "Thomas Sankara",
    figureImageUrl: "/assets/banners/politics/thomas_sankara.jpg",
    quoteText: "He who feeds you, controls you. We must dare to invent the future and consume what we produce with our own hands.",
    domainCategory: "POLITICS",
    backdropThemeCss: "theme-parliamentary",
    authorTitle: "President of Burkina Faso & Pan-African Leader",
    eraOrContext: "Champion of Youth Integrity & Self-Reliance",
    categoryBadge: "Self-Reliance & Honor",
    author: "Thomas Sankara",
    quote: "He who feeds you, controls you. We must dare to invent the future and consume what we produce with our own hands.",
    imageUrl: "/assets/banners/politics/thomas_sankara.jpg",
    module: "politics"
  },
  {
    id: "nkrumah_01",
    figureName: "Kwame Nkrumah",
    figureImageUrl: "/assets/banners/politics/kwame_nkrumah.jpg",
    quoteText: "Forward ever, backward never! We face neither East nor West: we face forward.",
    domainCategory: "POLITICS",
    backdropThemeCss: "theme-parliamentary",
    authorTitle: "Pan-Africanist & First President of Ghana",
    eraOrContext: "Champion of African Independence & Unity",
    categoryBadge: "African Renaissance",
    author: "Kwame Nkrumah",
    quote: "Forward ever, backward never! We face neither East nor West: we face forward.",
    imageUrl: "/assets/banners/politics/kwame_nkrumah.jpg",
    module: "politics"
  },

  // MARKETPLACE & VENDORS PANEL
  {
    id: "dangote_01",
    figureName: "Aliko Dangote",
    figureImageUrl: "/assets/banners/marketplace/aliko_dangote.jpg",
    quoteText: "To build a successful business, you have to start small and dream big. Passion, persistence, and consistency will take you anywhere.",
    domainCategory: "MARKETPLACE",
    backdropThemeCss: "theme-corporate",
    authorTitle: "Founder & Chairman, Dangote Group",
    eraOrContext: "Africa's Foremost Industrialist & Entrepreneur",
    categoryBadge: "Enterprise & Hustle",
    author: "Aliko Dangote",
    quote: "To build a successful business, you have to start small and dream big. Passion, persistence, and consistency will take you anywhere.",
    imageUrl: "/assets/banners/marketplace/aliko_dangote.jpg",
    module: "marketplace"
  },
  {
    id: "okonjo_iweala_01",
    figureName: "Dr. Ngozi Okonjo-Iweala",
    figureImageUrl: "/assets/banners/marketplace/ngozi_okonjo_iweala.jpg",
    quoteText: "When you have a vision, you have to stay focused on it despite the obstacles in your path.",
    domainCategory: "MARKETPLACE",
    backdropThemeCss: "theme-corporate",
    authorTitle: "Director-General, World Trade Organization (WTO)",
    eraOrContext: "Former Finance Minister of Nigeria & Global Economist",
    categoryBadge: "Global Trade & Integrity",
    author: "Dr. Ngozi Okonjo-Iweala",
    quote: "When you have a vision, you have to stay focused on it despite the obstacles in your path.",
    imageUrl: "/assets/banners/marketplace/ngozi_okonjo_iweala.jpg",
    module: "marketplace"
  },
  {
    id: "buffett_01",
    figureName: "Warren Buffett",
    figureImageUrl: "/assets/banners/marketplace/warren_buffett.jpg",
    quoteText: "The best investment you can make is an investment in yourself. The more you learn, the more you will earn.",
    domainCategory: "MARKETPLACE",
    backdropThemeCss: "theme-corporate",
    authorTitle: "Chairman & CEO, Berkshire Hathaway",
    eraOrContext: "Legendary Value Investor & Philanthropist",
    categoryBadge: "Compounding Value",
    author: "Warren Buffett",
    quote: "The best investment you can make is an investment in yourself. The more you learn, the more you will earn.",
    imageUrl: "/assets/banners/marketplace/warren_buffett.jpg",
    module: "marketplace"
  },

  // TECH & CIS FACULTY
  {
    id: "emeagwali_01",
    figureName: "Philip Emeagwali",
    figureImageUrl: "/assets/banners/tech/philip_emeagwali.jpg",
    quoteText: "The present is theirs; the future, for which I really worked, is mine. Supercomputing connects thousands of processors to work as one mind.",
    domainCategory: "TECH",
    backdropThemeCss: "theme-circuit",
    authorTitle: "Computer Scientist & Gordon Bell Prize Winner",
    eraOrContext: "Pioneer of Massively Parallel Supercomputing",
    categoryBadge: "Computing & Architecture",
    author: "Philip Emeagwali",
    quote: "The present is theirs; the future, for which I really worked, is mine. Supercomputing connects thousands of processors to work as one mind.",
    imageUrl: "/assets/banners/tech/philip_emeagwali.jpg",
    module: "academics"
  },
  {
    id: "tesla_01",
    figureName: "Nikola Tesla",
    figureImageUrl: "/assets/banners/tech/nikola_tesla.jpg",
    quoteText: "The progressive development of man is vitally dependent on invention. The mind is sharper and keener in seclusion and uninterrupted solitude.",
    domainCategory: "TECH",
    backdropThemeCss: "theme-circuit",
    authorTitle: "Inventor & Electrical Engineer",
    eraOrContext: "Father of Alternating Current (AC) & Wireless Power",
    categoryBadge: "Invention & Electrical Power",
    author: "Nikola Tesla",
    quote: "The progressive development of man is vitally dependent on invention. The mind is sharper and keener in seclusion and uninterrupted solitude.",
    imageUrl: "/assets/banners/tech/nikola_tesla.jpg",
    module: "academics"
  },
  {
    id: "lovelace_01",
    figureName: "Ada Lovelace",
    figureImageUrl: "/assets/banners/tech/ada_lovelace.jpg",
    quoteText: "That brain of mine is something more than merely mortal; as time will show. The Analytical Engine weaves algebraical patterns just as the loom weaves flowers.",
    domainCategory: "TECH",
    backdropThemeCss: "theme-circuit",
    authorTitle: "Mathematician & First Computer Programmer",
    eraOrContext: "Pioneer of Computational Algorithms",
    categoryBadge: "Algorithmic Science",
    author: "Ada Lovelace",
    quote: "That brain of mine is something more than merely mortal; as time will show. The Analytical Engine weaves algebraical patterns just as the loom weaves flowers.",
    imageUrl: "/assets/banners/tech/ada_lovelace.jpg",
    module: "academics"
  },

  // ARTS & HUMANITIES
  {
    id: "soyinka_01",
    figureName: "Wole Soyinka",
    figureImageUrl: "/assets/banners/arts/wole_soyinka.jpg",
    quoteText: "The greatest threat to freedom is the absence of criticism. A tiger does not proclaim his tigritude, he pounces.",
    domainCategory: "ARTS",
    backdropThemeCss: "theme-parchment",
    authorTitle: "Playwright, Poet & Nobel Laureate in Literature",
    eraOrContext: "First Black African Nobel Laureate in Literature",
    categoryBadge: "Literary Mastery",
    author: "Wole Soyinka",
    quote: "The greatest threat to freedom is the absence of criticism. A tiger does not proclaim his tigritude, he pounces.",
    imageUrl: "/assets/banners/arts/wole_soyinka.jpg",
    module: "arts"
  },
  {
    id: "achebe_01",
    figureName: "Chinua Achebe",
    figureImageUrl: "/assets/banners/arts/chinua_achebe.jpg",
    quoteText: "If you don't like someone else's story, you write your own. Until the lions have their own historians, the history of the hunt will always glorify the hunter.",
    domainCategory: "ARTS",
    backdropThemeCss: "theme-parchment",
    authorTitle: "Novelist, Poet & Scholar",
    eraOrContext: 'Father of Modern African Literature & Author of "Things Fall Apart"',
    categoryBadge: "African Narrative Voice",
    author: "Chinua Achebe",
    quote: "If you don't like someone else's story, you write your own. Until the lions have their own historians, the history of the hunt will always glorify the hunter.",
    imageUrl: "/assets/banners/arts/chinua_achebe.jpg",
    module: "arts"
  },

  // GENERAL & LEADERSHIP
  {
    id: "mlk_01",
    figureName: "Dr. Martin Luther King Jr.",
    figureImageUrl: "/assets/banners/general/martin_luther_king.jpg",
    quoteText: "The time is always right to do what is right. If you can't fly, then run; if you can't run, then walk; but whatever you do, you have to keep moving forward.",
    domainCategory: "GENERAL",
    backdropThemeCss: "theme-parliamentary",
    authorTitle: "Civil Rights Icon & Nobel Peace Prize Laureate",
    eraOrContext: "Champion of Equality & Nonviolent Resistance",
    categoryBadge: "Vision & Conscience",
    author: "Dr. Martin Luther King Jr.",
    quote: "The time is always right to do what is right. If you can't fly, then run; if you can't run, then walk; but whatever you do, you have to keep moving forward.",
    imageUrl: "/assets/banners/general/martin_luther_king.jpg",
    module: "feed"
  }
];

export const MOTIVATIONAL_QUOTES: MotivationCard[] = BANNER_DATABASE;

export const INITIAL_CAMPUS_SNAPS: CampusSnap[] = [];

export const INITIAL_CAMPUS_POSTS: CampusPost[] = [];

export const POLITICAL_FELICITATIONS = [
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

export const POLITICAL_CANDIDATES: PoliticalCandidate[] = [
  {
    id: 'cand-danladi',
    name: 'Hon. Ibrahim Danladi (Dan-Law)',
    runningFor: 'SUG President (CEC)',
    session: '2026/2027 Session',
    faculty: 'Faculty of Law',
    department: 'Common & Islamic Law',
    level: '400L',
    matricOrSlug: 'danladi-presidency',
    slogan: 'Vision 360: Equity, Student Welfare & Accountability',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    manifestoSummary: 'A comprehensive 4-pillar agenda aimed at digitizing student services, curbing unjustified shuttle fare hikes, guaranteeing uninterrupted water/power in school hostels, and instituting an emergency student welfare safety net.',
    manifestoPillars: [
      {
        title: '1. Transit & Shuttle Price Stabilization',
        description: 'Negotiate and sign a binding tripartite MoU between SUG, Park Management, and Student Affairs capping PS to Tanke bus fares at ₦150 maximum with peak-hour monitoring.'
      },
      {
        title: '2. 24/7 Digital Hubs & CBT WiFi Zones',
        description: 'Partner with campus tech societies to deploy high-speed academic WiFi routers across CBT Halls, CIS Basement, and Main Library reading rooms.'
      },
      {
        title: '3. Student Healthcare & Hostel Living Standards',
        description: 'Implement rapid response motorcycle ambulances for hostel emergencies and a monthly inspection scoreboard for hostel water purification systems.'
      },
      {
        title: '4. Student Entrepreneurship & Venture Grants',
        description: 'Establish the SUG Campus Founders Fund granting ₦50,000 to ₦100,000 micro-seed capital each semester to verified student ventures on Campus Foundry.'
      }
    ],
    videoPitchUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    townhallLink: 'https://meet.google.com/unilorin-sug-townhall',
    endorsementsCount: 0,
    endorsedByMe: false,
    campaignUpdates: [
      {
        id: 'u1',
        title: 'Town Hall with Village I & II Hostel Executives',
        date: 'Oct 2, 2026',
        content: 'Met with hostel block governors to discuss reliable power inverter installations for the upcoming exams.'
      },
      {
        id: 'u2',
        title: 'Endorsement from Engineering Students Association (NUESA)',
        date: 'Sept 29, 2026',
        content: 'NUESA congress officially adopted Vision 360 after our joint townhall at ETF hall.'
      }
    ],
    contacts: {
      whatsapp: '2348039281744',
      twitter: '@DanLaw_UNILORIN',
      instagram: '@danladi_for_sug'
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
    campaignUpdates: [
      {
        id: 'u3',
        title: 'Health & Wellness Outreach at Abuja Hostel Quad',
        date: 'Oct 3, 2026',
        content: 'Conducted free blood pressure and glucose screenings for over 300 students and hostel staff.'
      }
    ],
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
    manifestoSummary: 'Elevating NACOS into Nigeria’s leading collegiate computing association with direct internship pipelines to Paystack, Flutterwave, Moniepoint, and international remote roles.',
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

export const DEPARTMENT_RESOURCES: DepartmentResource[] = [
  // 100L
  {
    id: 'res-gns111',
    title: 'GNS 111: Use of English & Communication Skills Comprehensive CBT Bank',
    courseCode: 'GNS 111',
    faculty: 'General Studies Unit',
    department: 'All Departments',
    level: '100L',
    category: 'GNS & Orientation',
    description: '1,200 verified CBT questions covering Lexis & Structure, Concord, Antonyms/Synonyms, and Sentence Diagramming with answer explanations.',
    fileType: 'PDF',
    uploadedBy: 'General Studies Scholar Circle',
    downloadsCount: 3840,
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
    description: 'Summary tables of historical constitutional conferences, pre-colonial governance systems, and fundamental human rights clauses for rapid CBT scoring.',
    fileType: 'PDF',
    uploadedBy: 'History & Civics Society',
    downloadsCount: 2910,
    date: 'Harmattan 2026',
    tags: ['GNS 112', 'Citizenship', 'History', 'CBT Revision']
  },
  {
    id: 'res-csc111',
    title: 'CSC 111: Introduction to Computer Science & Algorithm Flowcharts',
    courseCode: 'CSC 111',
    faculty: 'Faculty of Communication and Information Sciences (CIS)',
    department: 'Computer Science',
    level: '100L',
    category: 'Lecture Slides',
    description: 'Official lecture slide deck annotated with Python flowchart translations and past test solutions.',
    fileType: 'PDF',
    uploadedBy: 'CIS Departmental Academic Committee',
    downloadsCount: 1450,
    date: 'Harmattan 2026',
    tags: ['CSC 111', 'Algorithms', 'Flowcharts', 'CIS']
  },

  // 200L & 300L
  {
    id: 'res-csc211',
    title: 'CSC 211: Object-Oriented Programming (Java / C++) Lab Repository',
    courseCode: 'CSC 211',
    faculty: 'Faculty of Communication and Information Sciences (CIS)',
    department: 'Computer Science',
    level: '200L',
    category: 'Past Questions & Solutions',
    description: 'Complete laboratory assignment walkthroughs, OOP inheritance diagrams, and 5-year exam paper breakdown.',
    fileType: 'ZIP',
    uploadedBy: 'NACOS Academic Wing',
    downloadsCount: 1120,
    date: 'Rain 2026',
    tags: ['CSC 211', 'Java', 'OOP', 'Code Repo']
  },
  {
    id: 'res-chm211',
    title: 'CHM 211: Organic Chemistry Reaction Mechanisms & Synthesis Handbook',
    courseCode: 'CHM 211',
    faculty: 'Faculty of Physical Sciences',
    department: 'Chemistry / Industrial Chemistry',
    level: '200L',
    category: 'Lecture Slides',
    description: 'Illustrated reaction pathways: SN1, SN2, E1, E2, electrophilic aromatic substitution, and NMR spectroscopy interpretation.',
    fileType: 'PDF',
    uploadedBy: 'Society of Chemistry Students',
    downloadsCount: 980,
    date: 'Harmattan 2026',
    tags: ['CHM 211', 'Organic Chemistry', 'Reactions']
  },
  {
    id: 'res-mee311',
    title: 'MEE 311: Applied Thermodynamics & Heat Engines Worked Examples',
    courseCode: 'MEE 311',
    faculty: 'Faculty of Engineering and Technology',
    department: 'Mechanical Engineering',
    level: '300L',
    category: 'Past Questions & Solutions',
    description: 'Otto, Diesel, Brayton and Rankine cycle enthalpy calculation templates with steam tables.',
    fileType: 'PDF',
    uploadedBy: 'NUESA Academic Council',
    downloadsCount: 760,
    date: 'Rain 2026',
    tags: ['MEE 311', 'Thermodynamics', 'Engineering']
  },

  // 400L & 500L
  {
    id: 'res-siwes-guide',
    title: 'SIWES 400L: Complete IT Placement Directory & Technical Logbook Template',
    courseCode: 'SIWES 400',
    faculty: 'All Applied & Tech Faculties',
    department: 'Multi-Departmental',
    level: '400L',
    category: 'SIWES & IT Leads',
    description: 'List of 85+ verified companies in Lagos, Abuja, Port Harcourt, and Ilorin currently accepting UNILORIN interns with sample ITF logbook entries and defense slides.',
    fileType: 'PDF',
    uploadedBy: 'UNILORIN Alumni Tech Network',
    downloadsCount: 3200,
    date: '2026/2027 Session',
    tags: ['SIWES', 'Industrial Training', 'IT Placement', 'Logbook']
  },
  {
    id: 'res-project-topics',
    title: 'Final Year Project (500L/400L) Topic Repository & LaTeX Thesis Template',
    courseCode: 'PRJ 599',
    faculty: 'All Faculties',
    department: 'All Departments',
    level: '500L',
    category: 'Final Year Projects',
    description: 'Standard UNILORIN postgraduate-compliant LaTeX and MS Word thesis templates with chapter guidelines, APA/IEEE reference style sheets, and defense rubric.',
    fileType: 'ZIP',
    uploadedBy: 'Senate Academic Planning Office',
    downloadsCount: 2450,
    date: '2026/2027 Session',
    tags: ['Final Year Project', 'Thesis Template', 'LaTeX', 'Defense']
  }
];

export const DEPARTMENT_GYRATING_CHANNELS = [
  {
    id: 'chan-cis',
    name: 'CIS Tech Gyrations & Code Hub',
    faculty: 'Faculty of Communication and Information Sciences (CIS)',
    activeMembers: 840,
    recentTopic: 'Who has solved the CSC 311 Graph Algorithm assignment?',
    avatar: '💻',
    bgGradient: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'chan-law',
    name: 'Law Jurists & Moot Court Gist',
    faculty: 'Faculty of Law',
    activeMembers: 520,
    recentTopic: 'Moot Court defense trials this Friday at Africa Hall',
    avatar: '⚖️',
    bgGradient: 'from-rose-600 to-amber-800',
  },
  {
    id: 'chan-eng',
    name: 'Engineering Workshop & CAD Hub',
    faculty: 'Faculty of Engineering and Technology',
    activeMembers: 910,
    recentTopic: 'Thermodynamics lab report submissions deadline updated',
    avatar: '⚙️',
    bgGradient: 'from-amber-600 to-orange-800',
  },
  {
    id: 'chan-med',
    name: 'Clinical & Health Sciences Round',
    faculty: 'Faculty of Clinical Sciences',
    activeMembers: 460,
    recentTopic: 'Anatomy dissection viva tips for 200L/300L students',
    avatar: '🩺',
    bgGradient: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'chan-arts',
    name: 'Arts, Drama & Creative Writers Quad',
    faculty: 'Faculty of Arts',
    activeMembers: 630,
    recentTopic: 'Spoken Word Poetry audition entries open for Convocation',
    avatar: '🎭',
    bgGradient: 'from-purple-600 to-pink-800',
  },
];

export const CAMPUS_CLUBS: CampusClub[] = [];

export const CAMPUS_NEWS: CampusNewsArticle[] = [];

export const CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    id: 'lm-senate',
    name: 'Senate Building & Administrative Tower',
    shortName: 'Senate Building',
    category: 'Administrative',
    zone: 'Permanent Site',
    description: 'The iconic multi-storey administrative epicenter of UNILORIN, housing the Vice-Chancellor’s office, Registrar, Student Affairs, and Academic Planning.',
    popularActivities: ['Matriculation & Convocation photo shoots', 'Student Affairs Inquiries', 'Official Clearances'],
    openingHours: '8:00 AM - 4:00 PM (Weekdays)',
    busStopNear: 'Senate Bus Stop',
    imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lm-cbt',
    name: '500-Seater CBT Examination Complex',
    shortName: 'CBT Complex',
    category: 'Academic Complex',
    zone: 'Permanent Site',
    description: 'State-of-the-art computer-based testing hub with dual auxiliary halls for GNS examinations, POST-UTME, and departmental continuous assessments.',
    popularActivities: ['GNS 111/112/211 CBT Examinations', 'Postgraduate Entrance Tests', 'Online Certification'],
    openingHours: '7:30 AM - 6:00 PM (Exam Sessions)',
    busStopNear: 'CBT Centre Junction',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lm-cis',
    name: 'Faculty of Communication and Information Sciences (CIS Complex)',
    shortName: 'CIS Building',
    category: 'Academic Complex',
    zone: 'Permanent Site',
    description: 'Modern faculty complex comprising Computer Science, Mass Comm, Info Science, Library Science, and Telecoms with software labs and digital broadcast studios.',
    popularActivities: ['Software Coding Labs', 'Campus Radio (UNILORIN 89.3 FM)', 'Tech Hackathons'],
    openingHours: '7:00 AM - 8:00 PM',
    busStopNear: 'CIS / Engineering Quad',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lm-auditorium',
    name: 'University Main Auditorium (4,000 Capacity)',
    shortName: 'Main Auditorium',
    category: 'Academic Complex',
    zone: 'Permanent Site',
    description: 'Grand indoor amphitheatre hosting University Inventions, Convocation ceremonies, Inaugural lectures, and SUG Presidential debates.',
    popularActivities: ['SUG Townhalls', 'Convocation Dramas', 'National Academic Conferences'],
    openingHours: 'Event-Based Schedules',
    busStopNear: 'Main Auditorium Loop',
    imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lm-sub',
    name: 'Student Union Building (SUB) & Commercial Quad',
    shortName: 'SUB Complex',
    category: 'Food & Amenities',
    zone: 'Permanent Site',
    description: 'Heart of student recreational life, featuring the SUG Secretariat, eateries, photocopy centers, gaming lounges, and event spaces.',
    popularActivities: ['Student Politics Meetings', 'Quick Lunch & Snacks', 'Document Printing & Photocopying'],
    openingHours: '7:00 AM - 10:00 PM Daily',
    busStopNear: 'SUB Roundabout',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lm-hostels-main',
    name: 'Village I & II Hostels (Lagos & Abuja Female/Male Halls)',
    shortName: 'Permanent Site Hostels',
    category: 'Hostels',
    zone: 'Permanent Site',
    description: 'Large residential hostel quads for thousands of undergraduate students. Thriving ecosystem of student room deliveries, bakeries, hair stylists, and dorm study groups.',
    popularActivities: ['Hostel Night Study Groups', 'Pastry & Food Room Delivery', 'Social Hangouts'],
    openingHours: 'Resident Access 24/7 (Visitors: 8am - 8pm)',
    busStopNear: 'Lagos Hostel Terminus',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
  }
];

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: 'route-ps-tanke',
    routeName: 'Permanent Site (PS) Terminal ⇄ Tanke Sanrab Gate',
    from: 'PS Bus Terminal (University Park)',
    to: 'Tanke Junction / Tipper Garage',
    fare: 150,
    frequencyMinutes: '3 - 5 mins',
    operatingHours: '6:30 AM - 9:30 PM',
    status: 'Active High Frequency',
    currentBusesActive: 34
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
    currentBusesActive: 18
  },
  {
    id: 'route-ps-mini',
    routeName: 'Permanent Site (PS) ⇄ Mini Campus (COHS / Sabo Oke)',
    from: 'PS Bus Terminal',
    to: 'Mini Campus Main Gate',
    fare: 200,
    frequencyMinutes: '15 mins',
    operatingHours: '7:00 AM - 7:00 PM',
    status: 'Normal Frequency',
    currentBusesActive: 8
  },
  {
    id: 'route-campus-keke',
    routeName: 'Campus Internal Shuttle: Gate ⇄ Hostels ⇄ Faculties',
    from: 'University Main Gate / Tanke Loop',
    to: 'Permanent Site Hostels & Academic Quad',
    fare: 100,
    frequencyMinutes: '2 mins',
    operatingHours: '7:00 AM - 10:00 PM',
    status: 'Active High Frequency',
    currentBusesActive: 45
  }
];

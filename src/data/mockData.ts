import { StudentBusiness, BusinessBlueprint, CampusHub } from '../types';

export const CATEGORIES = [
  'All Categories',
  'Food & Pastries',
  'Gadget Repairs & Tech',
  'Fashion, Thrift & Merch',
  'Barbing, Hair & Beauty',
  'Delivery & Errand Runners',
  'Printing & Academic Design',
] as const;

export const CAMPUS_ZONES = [
  { id: 'All', label: 'All Campus Zones' },
  { id: 'Permanent Site', label: 'Permanent Site (PS Hostels)' },
  { id: 'Tanke Off-Campus', label: 'Tanke Off-Campus' },
  { id: 'Mini Campus', label: 'Mini Campus' },
  { id: 'Sub-Hostels', label: 'Private & Sub-Hostels' },
];

export interface HostelOptionGroup {
  group: string;
  hostels: string[];
}

export const UNILORIN_HOSTEL_GROUPS: HostelOptionGroup[] = [
  {
    group: 'School-Owned Public Hostels (Main Campus)',
    hostels: [
      'Village I (Lagos Hostel - Compounds A, B, C, D, E)',
      'Village II (Lagos Female Hostel)',
      'Village IIIa (Abuja Female Hostel)',
      'Village IIIb (Kwara Female Hostel)',
      'Village IV (Zamfara Female Hostel)',
      'Village V (Trunil Female Hostel)',
      'Postgraduate (PG) Students Hostel',
      'Unilorin Pace-Setters Staff Multipurpose Cooperative Hostel',
    ],
  },
  {
    group: 'Satellite & Off-Main Campus School Hostels',
    hostels: [
      'Village I & II (College of Health Sciences)',
      'Veterinary Medicine Hostel (Sabo Oke)',
    ],
  },
  {
    group: 'On-Campus Private Hostels (Male)',
    hostels: [
      'Arafims 1 Hostel',
      'Arafims 2 Hostel',
      'Sanusi 1 Hostel',
      'Sanusi 2 Hostel',
      'Zapel Hostel',
      'International Hostel',
      'Pyramid Hostel',
      'Sky Hostel',
      'Takleemah Hostel',
      'Kikelomo Runsewe Hostel',
      'Health Care Hostel',
    ],
  },
  {
    group: 'On-Campus Private Hostels (Female)',
    hostels: [
      'Robiat Ajike Hostel',
      'Bethany Private Hostel',
      'Hawa Hostel',
      'Gulf Pearl Hostel (Gulf Pearl Apartments)',
      'Atlantic Heights Hostel',
      'IBIDUN Hostel',
      'Rubiks Hostel',
      'Albanic Hostel',
      'Queen Hostel',
      'Al-Mutawakil Hostel',
      'El-Mubarak Hostel',
      'Charis Hostel',
      'Easy and Quiet Hostel',
      'Moremi Hostel',
      'Kam Abioye Hostel',
      'Scientific Multipurpose Cooperative Hostel',
      'Probitas Multipurpose Cooperative Hostel',
      'Habibah Abake Hostel',
      'Edge Hostel',
      'Michael Hostel',
      'Primrose Hostel',
      'Probitas Doctrina Hostel',
    ],
  },
  {
    group: 'Tanke & Off-Campus Student Hubs',
    hostels: [
      'Tanke - University Road (Tipper Garage)',
      'Tanke - Mark Grounds / Oke-Odo',
      'Tanke - Sanrab / F-Division',
      'Tanke - Chapart / Akorede',
      'Tanke - Pipeline Road',
      'Jalala Quarters / Senior Staff Quarters',
      'Fate Road / GRA Student Lodges',
    ],
  },
];

export interface HostelInfo {
  name: string;
  campus: 'main' | 'mini' | 'offcampus';
  category: 'school' | 'private' | 'satellite' | 'offcampus';
  gender: 'male' | 'female' | 'any';
  groupName: string;
}

export const ALL_UNILORIN_HOSTELS_META: HostelInfo[] = [
  // School-Owned Public Hostels (Main Campus)
  { name: 'Village I (Lagos Hostel - Compounds A, B, C, D, E)', campus: 'main', category: 'school', gender: 'male', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Village II (Lagos Female Hostel)', campus: 'main', category: 'school', gender: 'female', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Village IIIa (Abuja Female Hostel)', campus: 'main', category: 'school', gender: 'female', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Village IIIb (Kwara Female Hostel)', campus: 'main', category: 'school', gender: 'female', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Village IV (Zamfara Female Hostel)', campus: 'main', category: 'school', gender: 'female', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Village V (Trunil Female Hostel)', campus: 'main', category: 'school', gender: 'female', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Postgraduate (PG) Students Hostel', campus: 'main', category: 'school', gender: 'any', groupName: 'School-Owned Public Hostels (Main Campus)' },
  { name: 'Unilorin Pace-Setters Staff Multipurpose Cooperative Hostel', campus: 'main', category: 'school', gender: 'any', groupName: 'School-Owned Public Hostels (Main Campus)' },

  // Satellite & Off-Main Campus School Hostels (Mini Campus / Satellite)
  { name: 'Village I & II (College of Health Sciences)', campus: 'mini', category: 'school', gender: 'any', groupName: 'Satellite & Off-Main Campus School Hostels' },
  { name: 'Veterinary Medicine Hostel (Sabo Oke)', campus: 'mini', category: 'school', gender: 'any', groupName: 'Satellite & Off-Main Campus School Hostels' },

  // On-Campus Private Hostels (Male)
  { name: 'Arafims 1 Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Arafims 2 Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Sanusi 1 Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Sanusi 2 Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Zapel Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'International Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Pyramid Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Sky Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Takleemah Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Kikelomo Runsewe Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },
  { name: 'Health Care Hostel', campus: 'main', category: 'private', gender: 'male', groupName: 'On-Campus Private Hostels (Male)' },

  // On-Campus Private Hostels (Female)
  { name: 'Robiat Ajike Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Bethany Private Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Hawa Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Gulf Pearl Hostel (Gulf Pearl Apartments)', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Atlantic Heights Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'IBIDUN Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Rubiks Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Albanic Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Queen Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Al-Mutawakil Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'El-Mubarak Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Charis Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Easy and Quiet Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Moremi Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Kam Abioye Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Scientific Multipurpose Cooperative Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Probitas Multipurpose Cooperative Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Habibah Abake Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Edge Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Michael Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Primrose Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },
  { name: 'Probitas Doctrina Hostel', campus: 'main', category: 'private', gender: 'female', groupName: 'On-Campus Private Hostels (Female)' },

  // Tanke & Off-Campus Student Hubs
  { name: 'Tanke - University Road (Tipper Garage)', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Tanke - Mark Grounds / Oke-Odo', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Tanke - Sanrab / F-Division', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Tanke - Chapart / Akorede', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Tanke - Pipeline Road', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Jalala Quarters / Senior Staff Quarters', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
  { name: 'Fate Road / GRA Student Lodges', campus: 'offcampus', category: 'offcampus', gender: 'any', groupName: 'Tanke & Off-Campus Student Hubs' },
];

export const ALL_UNILORIN_HOSTELS: string[] = UNILORIN_HOSTEL_GROUPS.flatMap((g) => g.hostels);

export interface FacultyDepartmentMapping {
  faculty: string;
  code: string;
  departments: string[];
}

export const UNILORIN_FACULTIES: FacultyDepartmentMapping[] = [
  {
    faculty: 'Faculty of Agriculture',
    code: 'AGRIC',
    departments: [
      'Agricultural Economics and Farm Management',
      'Agricultural Extension and Rural Development',
      'Agronomy',
      'Animal Production',
      'Aquaculture and Fisheries',
      'Crop Protection',
      'Forest Resources Management',
      'Home Economics and Food Science',
    ],
  },
  {
    faculty: 'Faculty of Arts',
    code: 'ARTS',
    departments: [
      'Arabic',
      'English',
      'French',
      'History and International Studies',
      'Linguistics and Nigerian Languages',
      'Performing Arts',
      'Religions (Christian, Islamic, Comparative)',
    ],
  },
  {
    faculty: 'Faculty of Basic Medical Sciences',
    code: 'BMS',
    departments: [
      'Anatomy',
      'Medical Biochemistry',
      'Physiology',
    ],
  },
  {
    faculty: 'Faculty of Basic Clinical Sciences',
    code: 'BCS',
    departments: [
      'Chemical Pathology and Immunology',
      'Haematology and Blood Transfusion',
      'Medical Laboratory Science',
      'Medical Microbiology and Parasitology',
      'Pathology',
      'Pharmacology and Therapeutics',
      'Physiotherapy',
    ],
  },
  {
    faculty: 'Faculty of Clinical Sciences',
    code: 'CLINICAL',
    departments: [
      'Anaesthesia',
      'Behavioural Sciences',
      'Dentistry',
      'Epidemiology and Community Health',
      'Family Medicine',
      'Medicine',
      'Nursing Science',
      'Obstetrics and Gynaecology',
      'Ophthalmology',
      'Otorhinolaryngology (ENT)',
      'Paediatrics and Child Health',
      'Radiology',
      'Surgery',
    ],
  },
  {
    faculty: 'Faculty of Communication and Information Sciences (CIS)',
    code: 'CIS',
    departments: [
      'Computer Science',
      'Information and Communication Science',
      'Library and Information Science',
      'Mass Communication',
      'Telecommunication Science',
    ],
  },
  {
    faculty: 'Faculty of Education',
    code: 'EDU',
    departments: [
      'Adult and Primary Education',
      'Arts Education',
      'Counsellor Education',
      'Educational Management',
      'Educational Technology',
      'Health Promotion and Environmental Health Education',
      'Human Kinetics Education',
      'Science Education',
      'Social Sciences Education',
    ],
  },
  {
    faculty: 'Faculty of Engineering and Technology',
    code: 'ENG',
    departments: [
      'Agricultural and Biosystems Engineering',
      'Biomedical Engineering',
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Engineering',
      'Electrical and Electronics Engineering',
      'Food and Bioprocess Engineering',
      'Materials and Metallurgical Engineering',
      'Mechanical Engineering',
      'Water Resources and Environmental Engineering',
    ],
  },
  {
    faculty: 'Faculty of Environmental Sciences',
    code: 'ENV',
    departments: [
      'Architecture',
      'Estate Management',
      'Quantity Surveying',
      'Surveying and Geoinformatics',
      'Urban and Regional Planning',
    ],
  },
  {
    faculty: 'Faculty of Law',
    code: 'LAW',
    departments: [
      'Business Law',
      'Common Law',
      'Islamic Law',
      'Jurisprudence and International Law',
      'Private and Property Law',
      'Public Law',
    ],
  },
  {
    faculty: 'Faculty of Life Sciences',
    code: 'LIFE',
    departments: [
      'Biochemistry',
      'Microbiology',
      'Optometry and Vision Sciences',
      'Plant Biology',
      'Zoology',
    ],
  },
  {
    faculty: 'Faculty of Management Sciences',
    code: 'MGT',
    departments: [
      'Accounting',
      'Business Administration',
      'Finance',
      'Industrial Relations and Personnel Management',
      'Marketing',
      'Public Administration',
    ],
  },
  {
    faculty: 'Faculty of Pharmaceutical Sciences',
    code: 'PHARM',
    departments: [
      'Clinical Pharmacy and Pharmacy Practice',
      'Industrial Pharmacy',
      'Medicinal Chemistry',
      'Pharmaceutics and Pharmaceutical Technology',
      'Pharmacognosy and Drug Development',
      'Pharmacology and Toxicology',
    ],
  },
  {
    faculty: 'Faculty of Physical Sciences',
    code: 'PHYS',
    departments: [
      'Chemistry',
      'Geology and Mineral Sciences',
      'Geophysics',
      'Industrial Chemistry',
      'Mathematics',
      'Physics',
      'Statistics',
    ],
  },
  {
    faculty: 'Faculty of Social Sciences',
    code: 'SOC',
    departments: [
      'Criminology and Security Studies',
      'Economics',
      'Geography and Environmental Management',
      'Political Science',
      'Psychology',
      'Social Work',
      'Sociology',
    ],
  },
  {
    faculty: 'Faculty of Veterinary Medicine',
    code: 'VET',
    departments: [
      'Theriogenology and Production',
      'Veterinary Anatomy',
      'Veterinary Medicine',
      'Veterinary Microbiology',
      'Veterinary Parasitology and Entomology',
      'Veterinary Pathology',
      'Veterinary Pharmacology and Toxicology',
      'Veterinary Physiology and Biochemistry',
      'Veterinary Public Health and Preventive Medicine',
      'Veterinary Surgery and Radiology',
    ],
  },
];

export const ALL_UNILORIN_FACULTY_NAMES: string[] = UNILORIN_FACULTIES.map((f) => f.faculty);

export const ALL_UNILORIN_DEPARTMENTS: string[] = UNILORIN_FACULTIES.flatMap((f) => f.departments).sort();



export const INITIAL_BUSINESSES: StudentBusiness[] = [];

export const CAMPUS_HUBS: CampusHub[] = [
  {
    id: 'lagos-abuja-zone',
    name: 'Permanent Site Main Hostels',
    zone: 'PS Hostels',
    type: 'On-Campus Hostels',
    description: 'Encompasses Lagos, Abuja, Zamfara, Village 1 & 2. High density of student bakes, late-night dorm barbers, and dorm-to-dorm delivery runners.',
    topCategories: ['Food & Pastries', 'Dorm Barbers', 'Delivery Runners'],
    popularSpot: 'Lagos Hostel Common Quad',
    businessCount: 18,
  },
  {
    id: 'cis-engineering-quad',
    name: 'Academic Quad & Tech Hub',
    zone: 'CIS & Eng Faculties',
    type: 'Academic Complex',
    description: 'Hub for gadget repairs, laptop upgrades, laser printing, slide handouts, and tech accessories.',
    topCategories: ['Gadget Repairs & Tech', 'Printing & Academic Design'],
    popularSpot: 'CIS Basement Walkway',
    businessCount: 12,
  },
  {
    id: 'tanke-corridor',
    name: 'Tanke Off-Campus Strip',
    zone: 'Tanke Tipper & Sanrab',
    type: 'Off-Campus Hub',
    description: 'Vibrant student residential zone bustling with thrift fashion boutiques, sneaker cleaning, photography studios, and wholesale provisions.',
    topCategories: ['Fashion & Thrift', 'Photography', 'Food Vendors'],
    popularSpot: 'Tipper Garage & Mark Grounds',
    businessCount: 26,
  },
  {
    id: 'mini-campus-zone',
    name: 'Mini Campus & Law Center',
    zone: 'Mini Campus',
    type: 'Academic Complex',
    description: 'Academic community focusing on legal document services, book sourcing, cafeteria lunches, and quick errands.',
    topCategories: ['Printing & Law Handouts', 'Snacks'],
    popularSpot: 'Faculty of Law Foyer',
    businessCount: 8,
  },
];

export const TRADER_BLUEPRINTS: BusinessBlueprint[] = [
  {
    id: 'hostel-baking-blueprint',
    title: 'Hostel Micro-Bakery & Study Boxes',
    category: 'Food & Pastries',
    startupCapital: '₦15,000 – ₦25,000',
    potentialEarnings: '₦40,000 – ₦90,000 / month',
    difficulty: 'Beginner',
    summary: 'Turn an electric mini-oven or stovetop setup in your hostel kitchen into a steady revenue stream by packaging warm meat pies, sausage rolls, and study-night pastry boxes.',
    steps: [
      'Batch bake early morning (6:30am) for breakfast and evening (8:30pm) for night study groups.',
      'Take pre-orders on WhatsApp hostel groups 1 day in advance to minimize food waste.',
      'Use greaseproof branded wax bags with your WhatsApp order QR code printed on top.',
      'Offer bundle deals (e.g. 2 Meat pies + Chilled Zobo for ₦1,800).',
    ],
    tips: [
      'Never compromise on seasoning and real beef minced filling; word-of-mouth spreads instantly in hostels.',
      'Deliver right to room doors—convenience is why students will choose you over walking to the cafeteria.',
    ],
    equipmentNeeded: ['Electric mini-oven or heavy non-stick pot', 'Rolling pin & pastry cutters', 'Greaseproof bags', 'Digital kitchen scale'],
  },
  {
    id: 'dorm-barber-blueprint',
    title: 'Hostel Mobile Barbing & Styling',
    category: 'Barbing, Hair & Beauty',
    startupCapital: '₦20,000 – ₦35,000',
    potentialEarnings: '₦50,000 – ₦120,000 / month',
    difficulty: 'Intermediate',
    summary: 'Bring professional cuts right to student rooms. Many Unilorites dislike walking to Tanke salons or waiting for hours on Saturday mornings.',
    steps: [
      'Invest in reliable rechargeable clippers that do not depend on campus power fluctuations.',
      'Carry portable UV sanitizer or clipper spray to reassure clients of strict hygiene.',
      'Schedule 30-minute booking slots via WhatsApp status updates.',
      'Charge a ₦1,000 premium for hostel room door calls.',
    ],
    tips: [
      'Take high-definition before/after clips of tapers and fades for your WhatsApp Status and Instagram.',
      'Friday evenings and Sunday mornings are peak booking hours.',
    ],
    equipmentNeeded: ['Cordless hair clippers with guards', 'Blade sterilizer spray', 'Barber cape & neck strips', 'Hand mirror & grooming cape'],
  },
  {
    id: 'gadget-tech-plug-blueprint',
    title: 'Campus Screen Repair & Accessory Plug',
    category: 'Gadget Repairs & Tech',
    startupCapital: '₦30,000 – ₦50,000',
    potentialEarnings: '₦80,000 – ₦180,000 / month',
    difficulty: 'Intermediate',
    summary: 'Source quality wholesale smartphone screens, fast chargers, and OTG adapters, offering 30-minute express repairs near student lecture halls.',
    steps: [
      'Build a relationship with wholesale parts vendors in Lagos or local electronics markets.',
      'Always test new displays in front of the customer before sealing the phone.',
      'Provide a clear 30-day written guarantee to build lasting campus trust.',
      'Stock universal items: 20W iPhone fast chargers, Type-C cables, and tempered screen guards.',
    ],
    tips: [
      'Screens crack most often during exam rush and sports weeks—stock up ahead of time.',
      'Offer free screen protector application with every screen fix.',
    ],
    equipmentNeeded: ['Precision screwdriver toolkit', 'Suction cup & pry tools', 'Heat gun / heating pad', 'B-7000 frame adhesive'],
  },
  {
    id: 'vintage-thrift-plug-blueprint',
    title: 'Curated Thrift & Streetwear Reselling',
    category: 'Fashion, Thrift & Merch',
    startupCapital: '₦20,000 – ₦40,000',
    potentialEarnings: '₦60,000 – ₦140,000 / month',
    difficulty: 'Beginner',
    summary: 'Hand-pick vintage tees, denim, and oversized sportswear from early morning wholesale markets, wash and steam-iron them, and drop themed collections.',
    steps: [
      'Thrift early mornings on market days (Katangua / Mandate) for prime vintage graphic tees.',
      'Thoroughly wash, fragrance, and steam iron every item before taking photos.',
      'Shoot clean flat-lays or on-body pictures with natural afternoon lighting.',
      'Run weekly "Drops" at 7 PM on WhatsApp and Campus Foundry.',
    ],
    tips: [
      'State exact pit-to-pit measurements and length to eliminate size return issues.',
      'Hostel students love streetwear that stands out on lecture walkways.',
    ],
    equipmentNeeded: ['Steam iron', 'Measuring tape', 'Clear packaging envelopes', 'Smartphone with decent portrait camera'],
  },
];

export const CATEGORIES = [
  'All Categories',
  'Food & Pastries',
  'Gadget Repairs & Tech',
  'Fashion, Thrift & Merch',
  'Barbing, Hair & Beauty',
  'Delivery & Errand Runners',
  'Printing & Academic Design',
] as const;

export type BusinessCategory = typeof CATEGORIES[number];

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
    departments: ['Anatomy', 'Medical Biochemistry', 'Physiology'],
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

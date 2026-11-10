/**
 * Shared university configuration constants.
 * Add more universities here in the future as needed.
 */
export const UNIVERSITIES = [
  'University of Ilorin (UNILORIN)',
] as const;

export type UniversityOption = typeof UNIVERSITIES[number];

export const DEFAULT_UNIVERSITY: UniversityOption = 'University of Ilorin (UNILORIN)';

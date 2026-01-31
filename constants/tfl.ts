// TfL Transport Modes
export const TRANSPORT_MODES = ['tube', 'dlr', 'elizabeth-line'] as const;

export type TransportMode = typeof TRANSPORT_MODES[number];

// TfL Line Colors (matching official TfL branding)
export const LINE_COLORS: Record<string, string> = {
  // Underground
  'bakerloo': '#B36305',
  'central': '#E32017',
  'circle': '#FFD300',
  'district': '#00782A',
  'hammersmith-city': '#F3A9BB',
  'jubilee': '#A0A5A9',
  'metropolitan': '#9B0056',
  'northern': '#000000',
  'piccadilly': '#003688',
  'victoria': '#0098D4',
  'waterloo-city': '#95CDBA',
  
  // Elizabeth Line
  'elizabeth': '#9364CD',
  'elizabeth-line': '#9364CD',
  
  // DLR
  'dlr': '#00A4A7',
  
  // Overground (in case we expand)
  'london-overground': '#EE7C0E',
};

// Status Severity Levels
export const STATUS_SEVERITY = {
  SPECIAL_SERVICE: 0,
  CLOSED: 1,
  SUSPENDED: 2,
  PART_SUSPENDED: 3,
  PLANNED_CLOSURE: 4,
  PART_CLOSURE: 5,
  SEVERE_DELAYS: 6,
  REDUCED_SERVICE: 7,
  BUS_SERVICE: 8,
  MINOR_DELAYS: 9,
  GOOD_SERVICE: 10,
  PART_CLOSED: 11,
  EXIT_ONLY: 12,
  NO_STEP_FREE_ACCESS: 13,
  CHANGE_OF_FREQUENCY: 14,
  DIVERTED: 15,
  NOT_RUNNING: 16,
  ISSUES_REPORTED: 17,
  NO_ISSUES: 18,
  INFORMATION: 19,
  SERVICE_CLOSED: 20,
} as const;

// API Endpoints
export const TFL_API_BASE = 'https://api.tfl.gov.uk';

export const API_ENDPOINTS = {
  STOP_POINT_SEARCH: '/StopPoint/Search',
  STOP_POINT_BY_ID: '/StopPoint',
  STOP_POINT_ARRIVALS: '/StopPoint/{id}/Arrivals',
  LINE_STATUS: '/Line/Mode/{modes}/Status',
  LINE_DISRUPTION: '/Line/{ids}/Disruption',
  LINE_ARRIVALS: '/Line/{id}/Arrivals',
} as const;

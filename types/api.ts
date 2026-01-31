// TfL API Response types
// These match the actual TfL API response structure

export interface TflStopPoint {
  $type: string;
  id: string;
  url: string;
  commonName: string;
  placeType: string;
  modes: string[];
  icsCode?: string;
  stopType?: string;
  stationNaptan?: string;
  lines?: TflLine[];
  lineGroup?: TflLineGroup[];
  lineModeGroups?: TflLineModeGroup[];
  status?: boolean;
  lat?: number;
  lon?: number;
}

export interface TflLine {
  $type: string;
  id: string;
  name: string;
  modeName: string;
  disruptions?: any[];
  created?: string;
  modified?: string;
}

export interface TflLineGroup {
  $type: string;
  naptanIdReference?: string;
  stationAtcoCode?: string;
  lineIdentifier?: string[];
}

export interface TflLineModeGroup {
  $type: string;
  modeName: string;
  lineIdentifier: string[];
}

export interface TflSearchResponse {
  $type: string;
  query: string;
  total: number;
  matches: TflSearchMatch[];
}

export interface TflSearchMatch {
  $type: string;
  id: string;
  url: string;
  name: string;
  lat: number;
  lon: number;
  modes?: string[];
}

export interface TflArrival {
  $type: string;
  id: string;
  operationType: number;
  vehicleId: string;
  naptanId: string;
  stationName: string;
  lineId: string;
  lineName: string;
  platformName: string;
  direction: string;
  bearing?: string;
  destinationNaptanId?: string;
  destinationName: string;
  timestamp: string;
  timeToStation: number;
  currentLocation: string;
  towards?: string;
  expectedArrival: string;
  timeToLive: string;
  modeName: string;
}

export interface TflLineStatus {
  $type: string;
  id: string;
  name: string;
  modeName: string;
  disruptions: any[];
  created: string;
  modified: string;
  lineStatuses: TflLineStatusDetail[];
}

export interface TflLineStatusDetail {
  $type: string;
  id: number;
  statusSeverity: number;
  statusSeverityDescription: string;
  reason?: string;
  created?: string;
  validityPeriods?: any[];
  disruption?: any;
}

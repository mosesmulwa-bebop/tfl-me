// Disruption types
export interface Disruption {
  id: string;
  lineId: string;
  lineName: string;
  category: 'RealTime' | 'PlannedWork' | 'Information';
  severity: string;
  description: string;
  closureText?: string;
  created: Date;
  lastUpdate: Date;
  affectedStops?: string[];
}

export interface LineStatus {
  lineId: string;
  lineName: string;
  statusSeverity: number; // 10 = Good Service, lower = worse
  statusSeverityDescription: string;
  reason?: string;
  disruption?: Disruption;
}

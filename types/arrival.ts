// Arrival types
export interface Arrival {
  id: string;
  lineName: string;
  lineId: string;
  direction: string;
  destinationName: string;
  platformName: string;
  timeToStation: number; // seconds
  expectedArrival: Date;
  currentLocation?: string;
  towards?: string;
}

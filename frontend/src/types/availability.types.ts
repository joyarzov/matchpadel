export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: 'free' | 'occupied';
}

export interface CourtAvailability {
  courtId: string;
  courtName: string;
  slots: TimeSlot[];
}

export interface CenterAvailability {
  clubId: string;
  clubName: string;
  clubAddress: string;
  openTime: string;
  closeTime: string;
  courts: CourtAvailability[];
  source: 'matchpoint' | 'easycancha';
  connected: boolean;
  error?: string;
}

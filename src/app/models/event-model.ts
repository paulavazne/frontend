export interface EventModel {
  id?: number;
  title: string;
  location: string;
  description: string;
  dateTime?: string;
  maxParticipants: number;
  currentParticipants: number;
  participantIds: number[];
}

// interfeiss, stuktura pasakuma objektiem. izmantoju visur kur kko darishu ar pasakuma datiem'
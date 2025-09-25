export interface TrackMetadata {
  id: string;
  filename: string;
  originalPath: string;
  wavPath: string;
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bpm: number;
  key: string;
  beatgrid: BeatGridPoint[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  // Music metadata
  title: string;
  artist: string;
  album: string;
  genre: string;
}

export interface BeatGridPoint {
  time: number; // in seconds
  bpm: number;
  confidence: number;
}

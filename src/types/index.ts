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
  structure: SongStructure;
  loops: Loop[];
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

export interface SongStructure {
  parts: Part[];
}

export interface Part {
  start: number; // in seconds
  end: number; // in seconds
  confidence: number;
  number: number; // 1, 2, 3, etc.
  description?: string; // Optional human-readable description
}

export interface Loop {
  start: number; // in seconds
  end: number; // in seconds
  bpm: number;
  confidence: number;
  type: "verse" | "chorus" | "bridge" | "breakdown" | "custom";
  name: string;
  description?: string;
}

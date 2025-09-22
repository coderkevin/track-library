// Analysis constants for audio processing

export const BPM_ANALYSIS = {
  MIN_BPM: 60,
  MAX_BPM: 200,
  BPM_STEP: 0.5,
  WINDOW_SIZE_SECONDS: 2,
  HOP_SIZE_SECONDS: 1,
  BEATGRID_WINDOW_SECONDS: 4,
} as const;

export const KEY_ANALYSIS = {
  CHROMA_BINS: 12,
  DEFAULT_KEY: "C",
} as const;

export const STRUCTURE_ANALYSIS = {
  WINDOW_SIZE_SECONDS: 0.1, // 100ms windows
  HOP_SIZE_SECONDS: 0.05, // 50ms hop
  MIN_PART_DURATION_SECONDS: 8, // Minimum duration for a part
  CHANGE_THRESHOLD: 0.6, // High threshold for major structural changes
  SMOOTHING_WINDOW: 5, // Window size for smoothing features
  ANALYSIS_WINDOW: 20, // Window size for change analysis
} as const;

export const LOOP_ANALYSIS = {
  MIN_LOOP_SCORE: 0.6,
  WINDOW_SIZE_SECONDS: 4,
  HOP_SIZE_SECONDS: 1,
  ENERGY_THRESHOLD: 0.2,
  CENTROID_THRESHOLD: 0.3,
  RHYTHMIC_WINDOW_SECONDS: 0.5,
  HARMONIC_WINDOW_SECONDS: 0.1,
  BEATS_PER_BAR: 4,
  LOOP_HOP_SECONDS: 0.5,
} as const;

export const AUDIO_PROCESSING = {
  DEFAULT_SAMPLE_RATE: 44100,
  DEFAULT_BIT_DEPTH: 16,
  DEFAULT_CHANNELS: 2,
  WAV_CODEC: "pcm_s16le",
} as const;

// Krumhansl-Schmuckler key profiles
export const KEY_PROFILES: Record<string, number[]> = {
  C: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  "C#": [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  D: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  "D#": [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  E: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  F: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  "F#": [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  G: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  "G#": [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  A: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  "A#": [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
  B: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
} as const;

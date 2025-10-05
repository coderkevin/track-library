import { BeatGridPoint } from "../../types/index.js";
import { getEssentiaInstance } from "./essentia.js";

export class BpmAnalyzer {
  private static instance: BpmAnalyzer;

  public static getInstance(): BpmAnalyzer {
    if (!BpmAnalyzer.instance) {
      BpmAnalyzer.instance = new BpmAnalyzer();
    }
    return BpmAnalyzer.instance;
  }

  /**
   * Analyze BPM using autocorrelation
   */
  async analyzeBpm(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<number> {
    const e = await getEssentiaInstance();
    const vec = (e as any).arrayToVector(audioData);
    const res = (e as any).RhythmExtractor2013(vec);
    return Math.round(res.bpm * 10) / 10;
  }

  /**
   * Analyze beatgrid for tempo changes
   */
  async analyzeBeatgrid(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<BeatGridPoint[]> {
    const e = await getEssentiaInstance();
    const vec = (e as any).arrayToVector(audioData);
    const res = (e as any).RhythmExtractor2013(vec);

    const bpm: number = res.bpm;
    const confidence: number =
      typeof res.confidence === "number" ? res.confidence : 1.0;
    const ticksLike: any =
      res.ticks || res.beats || res.beat_positions || res.beatTimes || null;

    const ticks = this.convertToNumberArray(e, ticksLike);
    if (ticks.length === 0) return [];

    const beatgrid: BeatGridPoint[] = ticks.map((t: number) => ({
      time: t,
      bpm,
      confidence,
    }));
    return beatgrid;
  }

  private convertToNumberArray(e: any, value: any): number[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as number[];
    // Handle TypedArrays returned by WASM bindings
    if (
      ArrayBuffer.isView(value) &&
      typeof (value as any).length === "number"
    ) {
      try {
        return Array.from(value as any);
      } catch {}
    }
    // Some bindings expose plain objects with numeric indices and length
    if (
      typeof value === "object" &&
      value !== null &&
      typeof (value as any).length === "number"
    ) {
      const len = (value as any).length;
      const out: number[] = [];
      for (let i = 0; i < len; i++) {
        const v = (value as any)[i];
        if (typeof v === "number") out.push(v);
      }
      if (out.length) return out;
    }
    if (typeof e.vectorToArray === "function") {
      try {
        const arr = e.vectorToArray(value);
        if (Array.isArray(arr)) return arr as number[];
      } catch {}
    }
    try {
      const size = typeof value.size === "function" ? value.size() : 0;
      const out: number[] = [];
      for (let i = 0; i < size; i++) {
        const v = typeof value.get === "function" ? value.get(i) : undefined;
        if (typeof v === "number") out.push(v);
      }
      return out;
    } catch {
      return [];
    }
  }

  // Confidence calculation removed; we rely on Essentia's confidence
}

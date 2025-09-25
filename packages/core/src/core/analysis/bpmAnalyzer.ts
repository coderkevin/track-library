import { BeatGridPoint } from "../../types/index.js";
import { BPM_ANALYSIS } from "./constants.js";

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
    // Simplified BPM analysis using autocorrelation
    // In a real implementation, you'd use more sophisticated algorithms

    const windowSize = Math.floor(
      sampleRate * BPM_ANALYSIS.WINDOW_SIZE_SECONDS
    );

    let bestBpm = 120;
    let bestScore = 0;

    for (
      let bpm = BPM_ANALYSIS.MIN_BPM;
      bpm <= BPM_ANALYSIS.MAX_BPM;
      bpm += BPM_ANALYSIS.BPM_STEP
    ) {
      const period = Math.floor((60 * sampleRate) / bpm);
      const score = this.calculateAutocorrelation(
        audioData,
        period,
        windowSize
      );

      if (score > bestScore) {
        bestScore = score;
        bestBpm = bpm;
      }
    }

    return Math.round(bestBpm * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Analyze beatgrid for tempo changes
   */
  async analyzeBeatgrid(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<BeatGridPoint[]> {
    const beatgrid: BeatGridPoint[] = [];
    const windowSize = Math.floor(
      sampleRate * BPM_ANALYSIS.BEATGRID_WINDOW_SECONDS
    );
    const hopSize = Math.floor(sampleRate * BPM_ANALYSIS.HOP_SIZE_SECONDS);

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const bpm = await this.analyzeBpm(window, sampleRate);
      const confidence = this.calculateConfidence(window, sampleRate);

      beatgrid.push({
        time: i / sampleRate,
        bpm,
        confidence,
      });
    }

    return beatgrid;
  }

  private calculateAutocorrelation(
    audioData: Float32Array,
    period: number,
    windowSize: number
  ): number {
    let sum = 0;
    const maxOffset = Math.min(period * 2, windowSize - period);

    for (let offset = 0; offset < maxOffset; offset++) {
      sum += audioData[offset] * audioData[offset + period];
    }

    return sum / maxOffset;
  }

  private calculateConfidence(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    // Simplified confidence calculation based on signal strength
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    return Math.min(sum / audioData.length, 1.0);
  }
}

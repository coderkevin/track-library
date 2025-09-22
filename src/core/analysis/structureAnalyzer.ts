import { SongStructure, TimeSegment } from "../../types/index.js";
import { STRUCTURE_ANALYSIS } from "./constants.js";

export class StructureAnalyzer {
  private static instance: StructureAnalyzer;

  public static getInstance(): StructureAnalyzer {
    if (!StructureAnalyzer.instance) {
      StructureAnalyzer.instance = new StructureAnalyzer();
    }
    return StructureAnalyzer.instance;
  }

  /**
   * Analyze song structure using energy and spectral features
   */
  async analyzeStructure(
    audioData: Float32Array,
    sampleRate: number,
    duration: number
  ): Promise<SongStructure> {
    const energy = this.calculateEnergy(audioData, sampleRate);
    const spectralCentroid = this.calculateSpectralCentroid(
      audioData,
      sampleRate
    );
    const zeroCrossingRate = this.calculateZeroCrossingRate(
      audioData,
      sampleRate
    );

    const segments = this.segmentAudio(
      energy,
      spectralCentroid,
      zeroCrossingRate,
      duration
    );
    const structure = this.classifySegments(segments, energy);

    return structure;
  }

  private calculateEnergy(
    audioData: Float32Array,
    sampleRate: number
  ): number[] {
    const windowSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.WINDOW_SIZE_SECONDS
    );
    const hopSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS
    );
    const energy: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += audioData[i + j] * audioData[i + j];
      }
      energy.push(sum / windowSize);
    }

    return energy;
  }

  private calculateSpectralCentroid(
    audioData: Float32Array,
    sampleRate: number
  ): number[] {
    const windowSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.WINDOW_SIZE_SECONDS
    );
    const hopSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS
    );
    const centroid: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const fft = this.simpleFFT(window);

      let numerator = 0;
      let denominator = 0;

      for (let j = 0; j < fft.length; j++) {
        const magnitude = Math.abs(fft[j]);
        numerator += j * magnitude;
        denominator += magnitude;
      }

      centroid.push(denominator > 0 ? numerator / denominator : 0);
    }

    return centroid;
  }

  private calculateZeroCrossingRate(
    audioData: Float32Array,
    sampleRate: number
  ): number[] {
    const windowSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.WINDOW_SIZE_SECONDS
    );
    const hopSize = Math.floor(
      sampleRate * STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS
    );
    const zcr: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      let crossings = 0;
      for (let j = 1; j < windowSize; j++) {
        if (audioData[i + j] >= 0 !== audioData[i + j - 1] >= 0) {
          crossings++;
        }
      }
      zcr.push(crossings / (windowSize - 1));
    }

    return zcr;
  }

  private segmentAudio(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[],
    duration: number
  ): TimeSegment[] {
    const segments: TimeSegment[] = [];
    const windowDuration = STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS;
    const minSegmentDuration = STRUCTURE_ANALYSIS.MIN_SEGMENT_DURATION_SECONDS;
    const minSegmentFrames = Math.floor(minSegmentDuration / windowDuration);

    let currentStart = 0;
    let currentType = "intro";

    for (let i = 1; i < energy.length; i++) {
      const change = this.calculateChange(energy, spectralCentroid, zcr, i);

      if (
        change > STRUCTURE_ANALYSIS.CHANGE_THRESHOLD &&
        i - currentStart > minSegmentFrames
      ) {
        // End current segment
        segments.push({
          start: currentStart * windowDuration,
          end: i * windowDuration,
          confidence: 0.8,
          type: currentType as any,
        });

        // Start new segment
        currentStart = i;
        currentType = this.classifySegmentType(
          energy,
          spectralCentroid,
          zcr,
          i
        );
      }
    }

    // Add final segment
    if (currentStart < energy.length) {
      segments.push({
        start: currentStart * windowDuration,
        end: duration,
        confidence: 0.8,
        type: currentType as any,
      });
    }

    return segments;
  }

  private calculateChange(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[],
    index: number
  ): number {
    const window = STRUCTURE_ANALYSIS.LOOKBACK_WINDOW;
    if (index < window) return 0;

    const currentEnergy =
      energy.slice(index - window, index).reduce((a, b) => a + b) / window;
    const prevEnergy =
      energy.slice(index - window * 2, index - window).reduce((a, b) => a + b) /
      window;

    const currentCentroid =
      spectralCentroid.slice(index - window, index).reduce((a, b) => a + b) /
      window;
    const prevCentroid =
      spectralCentroid
        .slice(index - window * 2, index - window)
        .reduce((a, b) => a + b) / window;

    const energyChange =
      Math.abs(currentEnergy - prevEnergy) / (prevEnergy + 0.001);
    const centroidChange =
      Math.abs(currentCentroid - prevCentroid) / (prevCentroid + 0.001);

    return (energyChange + centroidChange) / 2;
  }

  private classifySegmentType(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[],
    index: number
  ): string {
    const window = STRUCTURE_ANALYSIS.LOOKBACK_WINDOW;
    const avgEnergy =
      energy.slice(index - window, index).reduce((a, b) => a + b) / window;
    const avgCentroid =
      spectralCentroid.slice(index - window, index).reduce((a, b) => a + b) /
      window;
    const avgZcr =
      zcr.slice(index - window, index).reduce((a, b) => a + b) / window;

    if (avgEnergy < STRUCTURE_ANALYSIS.ENERGY_THRESHOLD_LOW) return "breakdown";
    if (
      avgEnergy > STRUCTURE_ANALYSIS.ENERGY_THRESHOLD_HIGH &&
      avgCentroid > STRUCTURE_ANALYSIS.CENTROID_THRESHOLD
    )
      return "drop";
    if (avgZcr > STRUCTURE_ANALYSIS.ZCR_THRESHOLD) return "verse";
    if (avgEnergy > 0.2) return "chorus";
    return "bridge";
  }

  private classifySegments(
    segments: TimeSegment[],
    energy: number[]
  ): SongStructure {
    const structure: SongStructure = {
      verses: [],
      choruses: [],
      bridges: [],
      breakdowns: [],
      drops: [],
    };

    for (const segment of segments) {
      switch (segment.type) {
        case "verse":
          structure.verses.push(segment);
          break;
        case "chorus":
          structure.choruses.push(segment);
          break;
        case "bridge":
          structure.bridges.push(segment);
          break;
        case "breakdown":
          structure.breakdowns.push(segment);
          break;
        case "drop":
          structure.drops.push(segment);
          break;
      }
    }

    // Identify intro and outro
    if (segments.length > 0) {
      const firstSegment = segments[0];
      if (firstSegment.type === "verse" || firstSegment.type === "breakdown") {
        structure.intro = {
          start: 0,
          end: firstSegment.start,
          confidence: 0.7,
          type: "intro",
        };
      }

      const lastSegment = segments[segments.length - 1];
      if (lastSegment.type === "verse" || lastSegment.type === "breakdown") {
        structure.outro = {
          start: lastSegment.end,
          end: lastSegment.end + STRUCTURE_ANALYSIS.OUTRO_DURATION_SECONDS,
          confidence: 0.7,
          type: "outro",
        };
      }
    }

    return structure;
  }

  private simpleFFT(input: Float32Array): Float32Array {
    // Simplified FFT implementation
    // In a real implementation, you'd use a proper FFT library
    const N = input.length;
    const output = new Float32Array(N);

    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N;
        real += input[n] * Math.cos(angle);
        imag += input[n] * Math.sin(angle);
      }

      output[k] = Math.sqrt(real * real + imag * imag);
    }

    return output;
  }
}

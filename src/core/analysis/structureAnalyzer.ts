import { SongStructure, Part } from "../../types/index.js";
import { STRUCTURE_ANALYSIS } from "./constants.js";
import FFT from "fft.js";

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

    // Detect major structural parts
    const parts = this.detectParts(
      energy,
      spectralCentroid,
      zeroCrossingRate,
      duration
    );

    return {
      parts: parts,
    };
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
      const fft = this.fastFFT(window);

      let numerator = 0;
      let denominator = 0;

      for (let j = 0; j < fft.length; j++) {
        const magnitude = Math.abs(fft[j]);
        numerator += j * magnitude;
        denominator += magnitude;
      }

      centroid.push(denominator > 0 ? numerator / denominator / fft.length : 0);
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

  private fastFFT(input: Float32Array): Float32Array {
    // Use fft.js for high-performance FFT computation
    const N = input.length;

    // fft.js requires power-of-2 sizes, so we pad if necessary
    const paddedSize = Math.pow(2, Math.ceil(Math.log2(N)));
    const paddedInput = new Float32Array(paddedSize);
    paddedInput.set(input);

    // Create FFT instance and compute
    const fft = new FFT(paddedSize);
    const fftResult = fft.createComplexArray();
    fft.realTransform(fftResult, paddedInput);

    // Convert to magnitude spectrum
    const output = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const real = fftResult[i * 2];
      const imag = fftResult[i * 2 + 1];
      output[i] = Math.sqrt(real * real + imag * imag);
    }

    return output;
  }

  /**
   * Detect major structural parts of the song
   */
  private detectParts(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[],
    duration: number
  ): Part[] {
    const parts: Part[] = [];
    const windowDuration = STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS;

    // Calculate smoothed features for more stable detection
    const smoothedEnergy = this.smoothArray(
      energy,
      STRUCTURE_ANALYSIS.SMOOTHING_WINDOW
    );
    const smoothedCentroid = this.smoothArray(
      spectralCentroid,
      STRUCTURE_ANALYSIS.SMOOTHING_WINDOW
    );
    const smoothedZcr = this.smoothArray(
      zcr,
      STRUCTURE_ANALYSIS.SMOOTHING_WINDOW
    );

    // Find significant change points
    const changePoints = this.findSignificantChanges(
      smoothedEnergy,
      smoothedCentroid,
      smoothedZcr
    );

    // Convert change points to time-based parts
    let currentTime = 0;
    let partNumber = 1;

    for (const changePoint of changePoints) {
      const changeTime = changePoint.index * windowDuration;

      // Only create part if it's long enough
      if (
        changeTime - currentTime >=
        STRUCTURE_ANALYSIS.MIN_PART_DURATION_SECONDS
      ) {
        parts.push({
          start: currentTime,
          end: changeTime,
          confidence: changePoint.confidence,
          number: partNumber++,
          description: this.describePart(parts.length, changeTime, duration),
        });
        currentTime = changeTime;
      }
    }

    // Add final part if there's remaining time
    if (currentTime < duration - 5) {
      parts.push({
        start: currentTime,
        end: duration,
        confidence: 0.8,
        number: partNumber,
        description: this.describePart(parts.length, duration, duration),
      });
    }

    return parts;
  }

  /**
   * Smooth an array using a moving average
   */
  private smoothArray(array: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < array.length; i++) {
      let sum = 0;
      let count = 0;

      for (
        let j = Math.max(0, i - halfWindow);
        j <= Math.min(array.length - 1, i + halfWindow);
        j++
      ) {
        sum += array[j];
        count++;
      }

      smoothed.push(sum / count);
    }

    return smoothed;
  }

  /**
   * Find significant change points in the audio features
   */
  private findSignificantChanges(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[]
  ): Array<{ index: number; confidence: number }> {
    const changePoints: Array<{ index: number; confidence: number }> = [];
    const minDistance = Math.floor(
      STRUCTURE_ANALYSIS.MIN_PART_DURATION_SECONDS /
        STRUCTURE_ANALYSIS.HOP_SIZE_SECONDS
    );

    for (let i = minDistance; i < energy.length - minDistance; i++) {
      const change = this.calculateSignificantChange(
        energy,
        spectralCentroid,
        zcr,
        i
      );

      if (change > STRUCTURE_ANALYSIS.CHANGE_THRESHOLD) {
        // High threshold for major structural changes
        // Check if this change point is far enough from the last one
        const lastChange = changePoints[changePoints.length - 1];
        if (!lastChange || i - lastChange.index > minDistance) {
          changePoints.push({
            index: i,
            confidence: Math.min(0.95, change),
          });
        }
      }
    }

    return changePoints;
  }

  /**
   * Calculate significant change score for a given point
   */
  private calculateSignificantChange(
    energy: number[],
    spectralCentroid: number[],
    zcr: number[],
    index: number
  ): number {
    const window = STRUCTURE_ANALYSIS.ANALYSIS_WINDOW;
    if (index < window || index >= energy.length - window) return 0;

    // Calculate energy change
    const prevEnergy =
      energy.slice(index - window, index).reduce((a, b) => a + b) / window;
    const nextEnergy =
      energy.slice(index, index + window).reduce((a, b) => a + b) / window;
    const energyChange =
      Math.abs(nextEnergy - prevEnergy) / (prevEnergy + 0.001);

    // Calculate spectral centroid change
    const prevCentroid =
      spectralCentroid.slice(index - window, index).reduce((a, b) => a + b) /
      window;
    const nextCentroid =
      spectralCentroid.slice(index, index + window).reduce((a, b) => a + b) /
      window;
    const centroidChange =
      Math.abs(nextCentroid - prevCentroid) / (prevCentroid + 0.001);

    // Calculate ZCR change
    const prevZcr =
      zcr.slice(index - window, index).reduce((a, b) => a + b) / window;
    const nextZcr =
      zcr.slice(index, index + window).reduce((a, b) => a + b) / window;
    const zcrChange = Math.abs(nextZcr - prevZcr) / (prevZcr + 0.001);

    // Weighted combination of all changes
    return energyChange * 0.5 + centroidChange * 0.3 + zcrChange * 0.2;
  }

  /**
   * Provide a human-readable description for a part
   */
  private describePart(
    partIndex: number,
    currentTime: number,
    totalDuration: number
  ): string {
    const timePercent = (currentTime / totalDuration) * 100;

    if (partIndex === 0) {
      return "Intro";
    } else if (timePercent > 85) {
      return "Outro";
    } else if (timePercent < 20) {
      return "Early Section";
    } else if (timePercent < 40) {
      return "Build Section";
    } else if (timePercent < 60) {
      return "Main Section";
    } else if (timePercent < 80) {
      return "Late Section";
    } else {
      return "Final Section";
    }
  }
}

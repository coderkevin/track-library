import { Loop, SongStructure } from "../../types/index.js";
import { LOOP_ANALYSIS } from "./constants.js";

export class LoopAnalyzer {
  private static instance: LoopAnalyzer;

  public static getInstance(): LoopAnalyzer {
    if (!LoopAnalyzer.instance) {
      LoopAnalyzer.instance = new LoopAnalyzer();
    }
    return LoopAnalyzer.instance;
  }

  /**
   * Analyze loops in the audio
   */
  async analyzeLoops(
    audioData: Float32Array,
    sampleRate: number,
    structure: SongStructure,
    bpm: number
  ): Promise<Loop[]> {
    const loops: Loop[] = [];

    // Find loops in different sections
    const sections = [
      ...structure.verses,
      ...structure.choruses,
      ...structure.bridges,
      ...structure.breakdowns,
    ];

    for (const section of sections) {
      const sectionLoops = await this.findLoopsInSection(
        audioData,
        sampleRate,
        section,
        bpm
      );
      loops.push(...sectionLoops);
    }

    // Find custom loops (user-defined interesting sections)
    const customLoops = await this.findCustomLoops(audioData, sampleRate, bpm);
    loops.push(...customLoops);

    return loops.sort((a, b) => a.start - b.start);
  }

  private async findLoopsInSection(
    audioData: Float32Array,
    sampleRate: number,
    section: any,
    bpm: number
  ): Promise<Loop[]> {
    const loops: Loop[] = [];
    const startFrame = Math.floor(section.start * sampleRate);
    const endFrame = Math.floor(section.end * sampleRate);
    const sectionData = audioData.slice(startFrame, endFrame);

    // Find 4-bar, 8-bar, and 16-bar loops
    const barLength = (60 / bpm) * LOOP_ANALYSIS.BEATS_PER_BAR * sampleRate;
    const loopLengths = [barLength, barLength * 2, barLength * 4]; // 4, 8, 16 bars

    for (const loopLength of loopLengths) {
      if (loopLength < sectionData.length) {
        const loop = await this.findBestLoop(
          sectionData,
          sampleRate,
          loopLength,
          section.start,
          section.type
        );

        if (loop) {
          loops.push(loop);
        }
      }
    }

    return loops;
  }

  private async findBestLoop(
    audioData: Float32Array,
    sampleRate: number,
    loopLength: number,
    offset: number,
    sectionType: string
  ): Promise<Loop | null> {
    const loopLengthFrames = Math.floor(loopLength);
    let bestLoop: Loop | null = null;
    let bestScore = 0;

    // Try different starting positions
    for (
      let start = 0;
      start < audioData.length - loopLengthFrames;
      start += Math.floor(sampleRate * LOOP_ANALYSIS.LOOP_HOP_SECONDS)
    ) {
      const end = start + loopLengthFrames;
      const loopData = audioData.slice(start, end);

      // Calculate loop quality score
      const score = this.calculateLoopScore(loopData, sampleRate);

      if (score > bestScore && score > LOOP_ANALYSIS.MIN_LOOP_SCORE) {
        bestScore = score;
        bestLoop = {
          start: offset + start / sampleRate,
          end: offset + end / sampleRate,
          bpm: 120, // This would be calculated from the loop
          confidence: score,
          type: sectionType as any,
          name: this.generateLoopName(sectionType, loopLength, sampleRate),
          description: this.generateLoopDescription(
            sectionType,
            loopLength,
            sampleRate
          ),
        };
      }
    }

    return bestLoop;
  }

  private async findCustomLoops(
    audioData: Float32Array,
    sampleRate: number,
    bpm: number
  ): Promise<Loop[]> {
    const loops: Loop[] = [];
    const windowSize = Math.floor(
      sampleRate * LOOP_ANALYSIS.WINDOW_SIZE_SECONDS
    );
    const hopSize = Math.floor(sampleRate * LOOP_ANALYSIS.HOP_SIZE_SECONDS);

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const energy = this.calculateEnergy(window);
      const spectralCentroid = this.calculateSpectralCentroid(window);

      // Look for interesting patterns
      if (
        energy > LOOP_ANALYSIS.ENERGY_THRESHOLD &&
        spectralCentroid > LOOP_ANALYSIS.CENTROID_THRESHOLD
      ) {
        const loop = await this.findBestLoop(
          window,
          sampleRate,
          windowSize,
          i / sampleRate,
          "custom"
        );

        if (loop) {
          loops.push(loop);
        }
      }
    }

    return loops;
  }

  private calculateLoopScore(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    // Calculate various features to determine loop quality
    const energy = this.calculateEnergy(audioData);
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    const zeroCrossingRate = this.calculateZeroCrossingRate(audioData);

    // Check for rhythmic consistency
    const rhythmicScore = this.calculateRhythmicConsistency(
      audioData,
      sampleRate
    );

    // Check for harmonic consistency
    const harmonicScore = this.calculateHarmonicConsistency(
      audioData,
      sampleRate
    );

    // Combine scores
    const score =
      energy * 0.3 +
      spectralCentroid * 0.2 +
      (1 - zeroCrossingRate) * 0.2 +
      rhythmicScore * 0.2 +
      harmonicScore * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return sum / audioData.length;
  }

  private calculateSpectralCentroid(audioData: Float32Array): number {
    // Simplified spectral centroid calculation
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < audioData.length; i++) {
      const magnitude = Math.abs(audioData[i]);
      numerator += i * magnitude;
      denominator += magnitude;
    }

    return denominator > 0 ? numerator / denominator / audioData.length : 0;
  }

  private calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if (audioData[i] >= 0 !== audioData[i - 1] >= 0) {
        crossings++;
      }
    }
    return crossings / (audioData.length - 1);
  }

  private calculateRhythmicConsistency(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    // Simplified rhythmic consistency calculation
    // In a real implementation, you'd analyze beat patterns
    const windowSize = Math.floor(
      sampleRate * LOOP_ANALYSIS.RHYTHMIC_WINDOW_SECONDS
    );
    const energies: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      let energy = 0;
      for (let j = 0; j < window.length; j++) {
        energy += window[j] * window[j];
      }
      energies.push(energy / window.length);
    }

    // Calculate variance (lower variance = more consistent)
    const mean = energies.reduce((a, b) => a + b) / energies.length;
    const variance =
      energies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      energies.length;

    return Math.max(0, 1 - variance);
  }

  private calculateHarmonicConsistency(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    // Simplified harmonic consistency calculation
    // In a real implementation, you'd analyze harmonic content
    const windowSize = Math.floor(
      sampleRate * LOOP_ANALYSIS.HARMONIC_WINDOW_SECONDS
    );
    const centroids: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      let centroid = 0;
      let sum = 0;

      for (let j = 0; j < window.length; j++) {
        const magnitude = Math.abs(window[j]);
        centroid += j * magnitude;
        sum += magnitude;
      }

      centroids.push(sum > 0 ? centroid / sum : 0);
    }

    // Calculate variance (lower variance = more consistent)
    const mean = centroids.reduce((a, b) => a + b) / centroids.length;
    const variance =
      centroids.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      centroids.length;

    return Math.max(0, 1 - variance);
  }

  private generateLoopName(
    sectionType: string,
    loopLength: number,
    sampleRate: number
  ): string {
    const duration = loopLength / sampleRate;
    const bars = Math.round(duration / LOOP_ANALYSIS.BEATS_PER_BAR);

    return `${sectionType}_${bars}bar_loop`;
  }

  private generateLoopDescription(
    sectionType: string,
    loopLength: number,
    sampleRate: number
  ): string {
    const duration = loopLength / sampleRate;
    const bars = Math.round(duration / LOOP_ANALYSIS.BEATS_PER_BAR);

    return `${bars}-bar ${sectionType} loop (${duration.toFixed(1)}s)`;
  }
}

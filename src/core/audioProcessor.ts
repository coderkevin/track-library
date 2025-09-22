import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import { TrackMetadata } from "../types/index.js";
import { AUDIO_PROCESSING } from "./analysis/constants.js";

export class AudioProcessor {
  private static instance: AudioProcessor;

  public static getInstance(): AudioProcessor {
    if (!AudioProcessor.instance) {
      AudioProcessor.instance = new AudioProcessor();
    }
    return AudioProcessor.instance;
  }

  /**
   * Convert MP3 to WAV format
   */
  async convertMp3ToWav(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("wav")
        .audioCodec(AUDIO_PROCESSING.WAV_CODEC)
        .audioChannels(AUDIO_PROCESSING.DEFAULT_CHANNELS)
        .audioFrequency(AUDIO_PROCESSING.DEFAULT_SAMPLE_RATE)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .save(outputPath);
    });
  }

  /**
   * Get basic audio file information
   */
  async getAudioInfo(filePath: string): Promise<{
    duration: number;
    sampleRate: number;
    bitDepth: number;
    channels: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) {
          reject(err);
          return;
        }

        const audioStream = metadata.streams.find(
          (stream: any) => stream.codec_type === "audio"
        );
        if (!audioStream) {
          reject(new Error("No audio stream found"));
          return;
        }

        resolve({
          duration: parseFloat(audioStream.duration || "0"),
          sampleRate:
            audioStream.sample_rate || AUDIO_PROCESSING.DEFAULT_SAMPLE_RATE,
          bitDepth:
            audioStream.bits_per_sample || AUDIO_PROCESSING.DEFAULT_BIT_DEPTH,
          channels: audioStream.channels || AUDIO_PROCESSING.DEFAULT_CHANNELS,
        });
      });
    });
  }

  /**
   * Extract audio data for analysis
   */
  async extractAudioData(filePath: string): Promise<Float32Array> {
    // This is a simplified version - in a real implementation,
    // you'd want to use a proper audio decoding library
    return new Promise((resolve, reject) => {
      // For now, we'll return a placeholder
      // In a real implementation, you'd decode the audio file
      // and return the actual audio samples
      resolve(new Float32Array(0));
    });
  }

  /**
   * Check if file is MP3
   */
  isMp3File(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".mp3";
  }

  /**
   * Check if file is WAV
   */
  isWavFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".wav";
  }

  /**
   * Generate unique track ID
   */
  generateTrackId(filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const baseName = path.parse(filename).name;
    return `${baseName}_${timestamp}_${random}`;
  }

  /**
   * Ensure output directory exists
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

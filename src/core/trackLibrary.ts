import { promises as fs } from "fs";
import path from "path";
import { TrackMetadata } from "../types/index.js";
import { AudioProcessor } from "./audioProcessor.js";
import { BpmAnalyzer } from "./analysis/bpmAnalyzer.js";
import { KeyAnalyzer } from "./analysis/keyAnalyzer.js";
import { StructureAnalyzer } from "./analysis/structureAnalyzer.js";
import { LoopAnalyzer } from "./analysis/loopAnalyzer.js";
import { getVersion } from "../utils/version.js";
import { extractMusicMetadata } from "../utils/metadataExtractor.js";

export class TrackLibrary {
  private static instance: TrackLibrary;
  private audioProcessor: AudioProcessor;
  private bpmAnalyzer: BpmAnalyzer;
  private keyAnalyzer: KeyAnalyzer;
  private structureAnalyzer: StructureAnalyzer;
  private loopAnalyzer: LoopAnalyzer;
  private libraryPath: string;

  constructor(libraryPath: string = "./tracks") {
    this.libraryPath = libraryPath;
    this.audioProcessor = AudioProcessor.getInstance();
    this.bpmAnalyzer = BpmAnalyzer.getInstance();
    this.keyAnalyzer = KeyAnalyzer.getInstance();
    this.structureAnalyzer = StructureAnalyzer.getInstance();
    this.loopAnalyzer = LoopAnalyzer.getInstance();
  }

  public static getInstance(libraryPath?: string): TrackLibrary {
    if (!TrackLibrary.instance) {
      TrackLibrary.instance = new TrackLibrary(libraryPath);
    }
    return TrackLibrary.instance;
  }

  /**
   * Import a new track into the library
   */
  async importTrack(filePath: string): Promise<TrackMetadata> {
    return this.importTrackWithMetadata(filePath, null);
  }

  /**
   * Import a new track into the library with custom metadata
   */
  async importTrackWithMetadata(
    filePath: string,
    customMetadata: {
      title: string;
      artist: string;
      album: string;
      genre: string;
    } | null
  ): Promise<TrackMetadata> {
    const filename = path.basename(filePath);
    const trackId = this.audioProcessor.generateTrackId(filename);

    // Ensure directory exists
    await this.audioProcessor.ensureDirectoryExists(this.libraryPath);

    // Get audio info and music metadata
    const audioInfo = await this.audioProcessor.getAudioInfo(filePath);
    const extractedMetadata = await extractMusicMetadata(filePath);

    // Use custom metadata if provided, otherwise use extracted metadata
    const musicMetadata = customMetadata || extractedMetadata;

    // Determine output paths
    const baseName = path.parse(filename).name;
    const wavPath = path.join(this.libraryPath, `${baseName}.wav`);
    const jsonPath = path.join(this.libraryPath, `${baseName}.json`);

    // Convert MP3 to WAV or copy WAV file
    if (this.audioProcessor.isMp3File(filePath)) {
      await this.audioProcessor.convertMp3ToWav(filePath, wavPath);
    } else if (this.audioProcessor.isWavFile(filePath)) {
      // Copy WAV file
      await fs.copyFile(filePath, wavPath);
    } else {
      throw new Error(
        "Unsupported audio format. Only MP3 and WAV files are supported."
      );
    }

    // Create initial metadata
    const metadata: TrackMetadata = {
      id: trackId,
      filename: filename,
      originalPath: filePath,
      wavPath: wavPath,
      duration: audioInfo.duration,
      sampleRate: audioInfo.sampleRate,
      bitDepth: audioInfo.bitDepth,
      channels: audioInfo.channels,
      bpm: 120, // Default value
      key: "C", // Default value
      beatgrid: [],
      structure: {
        verses: [],
        choruses: [],
        bridges: [],
        breakdowns: [],
        drops: [],
      },
      loops: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: getVersion(),
      // Music metadata
      title: musicMetadata.title,
      artist: musicMetadata.artist,
      album: musicMetadata.album,
      genre: musicMetadata.genre,
    };

    // Always perform full analysis
    await this.analyzeTrack(metadata);

    // Save metadata
    await this.saveTrackMetadata(metadata, jsonPath);

    return metadata;
  }

  /**
   * Analyze a track and update metadata
   */
  async analyzeTrack(metadata: TrackMetadata): Promise<void> {
    // Extract audio data for analysis
    const audioData = await this.audioProcessor.extractAudioData(
      metadata.wavPath
    );

    // Always run all analyses
    metadata.bpm = await this.bpmAnalyzer.analyzeBpm(
      audioData,
      metadata.sampleRate
    );

    metadata.key = await this.keyAnalyzer.analyzeKey(
      audioData,
      metadata.sampleRate
    );

    metadata.beatgrid = await this.bpmAnalyzer.analyzeBeatgrid(
      audioData,
      metadata.sampleRate
    );

    metadata.structure = await this.structureAnalyzer.analyzeStructure(
      audioData,
      metadata.sampleRate,
      metadata.duration
    );

    metadata.loops = await this.loopAnalyzer.analyzeLoops(
      audioData,
      metadata.sampleRate,
      metadata.structure,
      metadata.bpm
    );

    metadata.updatedAt = new Date();
  }

  /**
   * Save track metadata to JSON file
   */
  async saveTrackMetadata(
    metadata: TrackMetadata,
    jsonPath: string
  ): Promise<void> {
    const jsonData = JSON.stringify(metadata, null, 2);
    await fs.writeFile(jsonPath, jsonData, "utf8");
  }

  /**
   * Load track metadata from JSON file
   */
  async loadTrackMetadata(jsonPath: string): Promise<TrackMetadata> {
    const jsonData = await fs.readFile(jsonPath, "utf8");
    const metadata = JSON.parse(jsonData);

    // Convert date strings back to Date objects
    metadata.createdAt = new Date(metadata.createdAt);
    metadata.updatedAt = new Date(metadata.updatedAt);

    return metadata;
  }

  /**
   * Get all tracks in the library
   */
  async getAllTracks(): Promise<TrackMetadata[]> {
    const files = await fs.readdir(this.libraryPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const tracks: TrackMetadata[] = [];

    for (const jsonFile of jsonFiles) {
      try {
        const jsonPath = path.join(this.libraryPath, jsonFile);
        const metadata = await this.loadTrackMetadata(jsonPath);
        tracks.push(metadata);
      } catch (error) {
        console.warn(`Failed to load metadata for ${jsonFile}:`, error);
      }
    }

    return tracks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get track by ID
   */
  async getTrackById(trackId: string): Promise<TrackMetadata | null> {
    const tracks = await this.getAllTracks();
    return tracks.find((track) => track.id === trackId) || null;
  }

  /**
   * Search tracks by criteria
   */
  async searchTracks(criteria: {
    bpm?: { min?: number; max?: number };
    key?: string;
    duration?: { min?: number; max?: number };
    hasLoops?: boolean;
    artist?: string;
    search?: string;
  }): Promise<TrackMetadata[]> {
    const tracks = await this.getAllTracks();

    return tracks.filter((track) => {
      if (criteria.bpm) {
        if (criteria.bpm.min && track.bpm < criteria.bpm.min) return false;
        if (criteria.bpm.max && track.bpm > criteria.bpm.max) return false;
      }

      if (criteria.key && track.key !== criteria.key) return false;

      if (criteria.duration) {
        if (criteria.duration.min && track.duration < criteria.duration.min)
          return false;
        if (criteria.duration.max && track.duration > criteria.duration.max)
          return false;
      }

      if (criteria.hasLoops && track.loops.length === 0) return false;

      if (criteria.artist) {
        if (
          !track.artist.toLowerCase().includes(criteria.artist.toLowerCase())
        ) {
          return false;
        }
      }

      if (criteria.search) {
        const searchTerm = criteria.search.toLowerCase();
        const searchableText = [
          track.title,
          track.artist,
          track.album,
          track.genre,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Delete a track from the library
   */
  async deleteTrack(trackId: string): Promise<boolean> {
    const track = await this.getTrackById(trackId);
    if (!track) return false;

    try {
      // Delete WAV file
      await fs.unlink(track.wavPath);

      // Delete JSON metadata file
      const jsonPath = track.wavPath.replace(".wav", ".json");
      await fs.unlink(jsonPath);

      return true;
    } catch (error) {
      console.error(`Failed to delete track ${trackId}:`, error);
      return false;
    }
  }
}

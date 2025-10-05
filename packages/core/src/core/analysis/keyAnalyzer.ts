import { getEssentiaInstance } from "./essentia.js";

export class KeyAnalyzer {
  private static instance: KeyAnalyzer;

  public static getInstance(): KeyAnalyzer {
    if (!KeyAnalyzer.instance) {
      KeyAnalyzer.instance = new KeyAnalyzer();
    }
    return KeyAnalyzer.instance;
  }

  /**
   * Analyze musical key using chroma features
   */
  async analyzeKey(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<string> {
    const e = await getEssentiaInstance();
    const vec = (e as any).arrayToVector(audioData);
    const res = (e as any).KeyExtractor(vec);
    return res.scale === "minor" ? `${res.key}m` : res.key;
  }
}

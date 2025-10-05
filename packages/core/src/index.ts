export { TrackLibrary } from "./core/trackLibrary.js";
export { AudioProcessor } from "./core/audioProcessor.js";
export { BpmAnalyzer } from "./core/analysis/bpmAnalyzer.js";
export { KeyAnalyzer } from "./core/analysis/keyAnalyzer.js";
export * from "./types/index.js";
// ambient typing for essentia.js when @types are not available
declare module "essentia.js";

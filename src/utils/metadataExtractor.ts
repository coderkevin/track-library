import { parseFile } from "music-metadata";
import path from "path";

export interface MusicMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
}

/**
 * Extract music metadata from audio file
 */
export async function extractMusicMetadata(
  filePath: string
): Promise<MusicMetadata> {
  try {
    const metadata = await parseFile(filePath);

    // Extract metadata with fallbacks
    const title =
      metadata.common.title || path.parse(filePath).name || "Unknown Title";

    const artist =
      metadata.common.artist || metadata.common.albumartist || "Unknown Artist";

    const album = metadata.common.album || "Unknown Album";

    const genre = metadata.common.genre?.[0] || "Unknown Genre";

    return {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim(),
      genre: genre.trim(),
    };
  } catch (error) {
    // If metadata extraction fails, return defaults
    const filename = path.parse(filePath).name;
    return {
      title: filename,
      artist: "Unknown Artist",
      album: "Unknown Album",
      genre: "Unknown Genre",
    };
  }
}

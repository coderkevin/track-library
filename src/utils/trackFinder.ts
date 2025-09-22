import { TrackLibrary } from "../core/trackLibrary.js";
import { TrackMetadata } from "../types/index.js";
import chalk from "chalk";

export async function findTrackByIdentifier(
  library: TrackLibrary,
  identifier: string
): Promise<TrackMetadata | null> {
  const tracks = await library.getAllTracks();

  // First try exact ID match
  let track = tracks.find((t) => t.id === identifier);
  if (track) return track;

  // Try exact title match
  track = tracks.find(
    (t) => t.title.toLowerCase() === identifier.toLowerCase()
  );
  if (track) return track;

  // Try exact artist match
  track = tracks.find(
    (t) => t.artist.toLowerCase() === identifier.toLowerCase()
  );
  if (track) return track;

  // Try partial matches
  const lowerIdentifier = identifier.toLowerCase();

  // Partial title match
  track = tracks.find((t) => t.title.toLowerCase().includes(lowerIdentifier));
  if (track) return track;

  // Partial artist match
  track = tracks.find((t) => t.artist.toLowerCase().includes(lowerIdentifier));
  if (track) return track;

  // Partial filename match
  track = tracks.find((t) =>
    t.filename.toLowerCase().includes(lowerIdentifier)
  );
  if (track) return track;

  // If multiple matches, show them and let user choose
  const matches = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(lowerIdentifier) ||
      t.artist.toLowerCase().includes(lowerIdentifier) ||
      t.filename.toLowerCase().includes(lowerIdentifier)
  );

  if (matches.length > 1) {
    console.log(
      chalk.yellow(`\nFound ${matches.length} tracks matching '${identifier}':`)
    );
    matches.forEach((match, index) => {
      console.log(
        chalk.gray(`  ${index + 1}. ${match.title} by ${match.artist}`)
      );
    });
    console.log(
      chalk.blue(
        "\nUse a more specific search term to narrow down the results."
      )
    );
    return null;
  }

  return null;
}

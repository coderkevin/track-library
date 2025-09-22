#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { TrackLibrary } from "../core/trackLibrary.js";
import { findTrackByIdentifier } from "../utils/trackFinder.js";

const program = new Command();

program
  .name("reimport")
  .description("Re-analyze tracks in the library")
  .version("1.0.0")
  .argument(
    "[identifier]",
    "Track to analyze (title, artist, or partial match) - if not provided, analyzes all tracks"
  )
  .action(async (identifier, options) => {
    try {
      const library = TrackLibrary.getInstance();

      // Always analyze everything

      if (identifier) {
        // Analyze specific track
        const track = await findTrackByIdentifier(library, identifier);
        if (!track) {
          console.log(chalk.red(`Track '${identifier}' not found.`));
          console.log(
            chalk.yellow("Try using a partial title or artist name.")
          );
          console.log(
            chalk.gray("Use 'npm run list' to see available tracks.")
          );
          return;
        }

        const spinner = ora(`Analyzing track: ${track.filename}`).start();

        await library.analyzeTrack(track);

        // Save updated metadata
        const jsonPath = track.wavPath.replace(".wav", ".json");
        await library.saveTrackMetadata(track, jsonPath);

        spinner.succeed(`Analysis complete for ${track.filename}`);

        // Display results
        console.log("\n" + chalk.green("Analysis Results:"));
        console.log(chalk.blue("  BPM:"), track.bpm);
        console.log(chalk.blue("  Key:"), track.key);
        console.log(chalk.blue("  Beatgrid points:"), track.beatgrid.length);
        console.log(chalk.blue("  Structure:"));
        console.log(chalk.gray("    Parts:"), track.structure.parts.length);

        // Show parts details
        if (track.structure.parts.length > 0) {
          console.log(chalk.blue("  Parts:"));
          track.structure.parts.forEach((part) => {
            const startTime = `${Math.floor(part.start / 60)}:${(
              part.start % 60
            )
              .toFixed(1)
              .padStart(4, "0")}`;
            const endTime = `${Math.floor(part.end / 60)}:${(part.end % 60)
              .toFixed(1)
              .padStart(4, "0")}`;
            console.log(
              chalk.gray(`    Part ${part.number}:`),
              `${startTime}-${endTime}`,
              chalk.cyan(`(${part.description})`)
            );
          });
        }
        console.log(chalk.blue("  Loops:"), track.loops.length);
      } else {
        // Analyze all tracks
        const tracks = await library.getAllTracks();

        if (tracks.length === 0) {
          console.log(chalk.yellow("No tracks found in library."));
          return;
        }

        console.log(chalk.green(`Analyzing ${tracks.length} track(s)...\n`));

        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          const spinner = ora(
            `Analyzing ${i + 1}/${tracks.length}: ${track.filename}`
          ).start();

          try {
            await library.analyzeTrack(track);

            // Save updated metadata
            const jsonPath = track.wavPath.replace(".wav", ".json");
            await library.saveTrackMetadata(track, jsonPath);

            spinner.succeed(`Completed: ${track.filename}`);
          } catch (error) {
            spinner.fail(
              `Failed: ${track.filename} - ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }

        console.log(chalk.green("\nAnalysis complete!"));
      }
    } catch (error) {
      console.error(
        chalk.red("Error during analysis:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();

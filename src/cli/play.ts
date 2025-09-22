#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { TrackLibrary } from "../core/trackLibrary.js";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { findTrackByIdentifier } from "../utils/trackFinder.js";

const program = new Command();

program
  .name("play")
  .description("Play a track")
  .version("1.0.0")
  .argument(
    "<track-identifier>",
    "Track to play (title, artist, or partial match)"
  )
  .option("-l, --list", "List track info without playing")
  .action(async (trackIdentifier, options) => {
    try {
      const library = TrackLibrary.getInstance();
      const track = await findTrackByIdentifier(library, trackIdentifier);

      if (!track) {
        console.log(chalk.red(`Track '${trackIdentifier}' not found.`));
        console.log(chalk.yellow("Try using a partial title or artist name."));
        console.log(chalk.gray("Use 'npm run list' to see available tracks."));
        return;
      }

      // Display track information
      console.log(chalk.green(`\nTrack: ${track.title} by ${track.artist}`));
      console.log(
        chalk.blue("Duration:"),
        `${Math.floor(track.duration / 60)}:${(track.duration % 60)
          .toFixed(1)
          .padStart(4, "0")}`
      );
      console.log(chalk.blue("BPM:"), track.bpm);
      console.log(chalk.blue("Key:"), track.key);
      console.log();

      if (options.list) {
        return; // Just list, don't play
      }

      // Check if WAV file exists
      if (!(await fileExists(track.wavPath))) {
        console.log(chalk.red(`WAV file not found: ${track.wavPath}`));
        console.log(
          chalk.yellow(
            "Try running the import command first to convert the audio."
          )
        );
        return;
      }

      // Play the entire track
      console.log(chalk.blue("\nPlaying track..."));
      await playTrack(track.wavPath, track.duration);
    } catch (error) {
      console.error(
        chalk.red("Error during playback:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function playTrack(wavPath: string, duration: number) {
  console.log(chalk.blue(`Playing track (${duration.toFixed(1)}s)...`));

  return new Promise<void>((resolve, reject) => {
    const ffplay = spawn(
      "ffplay",
      [
        "-nodisp", // No video display
        "-autoexit", // Exit when done
        wavPath,
      ],
      {
        stdio: "inherit",
      }
    );

    ffplay.on("error", (error) => {
      console.error(chalk.red("Error playing audio:"), error.message);
      console.log(
        chalk.yellow("Make sure ffplay is installed (comes with ffmpeg)")
      );
      reject(error);
    });

    ffplay.on("close", (code) => {
      if (code === 0) {
        console.log(chalk.green("✓ Track finished playing"));
        resolve();
      } else {
        console.log(chalk.red(`ffplay exited with code ${code}`));
        reject(new Error(`ffplay exited with code ${code}`));
      }
    });
  });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

program.parse();

#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { TrackLibrary } from "../core/trackLibrary.js";

const program = new Command();

program
  .name("list")
  .description("List all tracks in the library")
  .version("1.0.0")
  .option("-b, --bpm <range>", 'Filter by BPM range (e.g., "120-140")')
  .option("-k, --key <key>", "Filter by musical key")
  .option("-d, --duration <range>", 'Filter by duration range (e.g., "60-300")')
  .option("-l, --loops", "Only show tracks with loops")
  .option("-a, --artist <artist>", "Filter by artist name (partial match)")
  .option(
    "-s, --search <term>",
    "Search in title, artist, album, or genre (partial match)"
  )
  .option("-j, --json", "Output as JSON")
  .action(async (options) => {
    try {
      const library = TrackLibrary.getInstance();

      // Parse filter criteria
      const criteria: any = {};

      if (options.bpm) {
        const [min, max] = options.bpm.split("-").map(Number);
        criteria.bpm = { min, max };
      }

      if (options.key) {
        criteria.key = options.key;
      }

      if (options.duration) {
        const [min, max] = options.duration.split("-").map(Number);
        criteria.duration = { min, max };
      }

      if (options.loops) {
        criteria.hasLoops = true;
      }

      if (options.artist) {
        criteria.artist = options.artist;
      }

      if (options.search) {
        criteria.search = options.search;
      }

      // Get tracks
      const tracks =
        Object.keys(criteria).length > 0
          ? await library.searchTracks(criteria)
          : await library.getAllTracks();

      if (options.json) {
        console.log(JSON.stringify(tracks, null, 2));
        return;
      }

      // Display tracks
      if (tracks.length === 0) {
        console.log(chalk.yellow("No tracks found in library."));
        return;
      }

      console.log(chalk.green(`Found ${tracks.length} track(s):\n`));

      tracks.forEach((track, index) => {
        console.log(chalk.blue(`${index + 1}. ${track.title}`));
        console.log(chalk.gray(`   Artist: ${track.artist}`));
        console.log(chalk.gray(`   Album: ${track.album}`));
        console.log(chalk.gray(`   Genre: ${track.genre}`));
        console.log(chalk.gray(`   Duration: ${track.duration.toFixed(1)}s`));
        console.log(chalk.gray(`   BPM: ${track.bpm}`));
        console.log(chalk.gray(`   Key: ${track.key}`));
        console.log(chalk.gray(`   Loops: ${track.loops.length}`));
        console.log(
          chalk.gray(`   Created: ${track.createdAt.toLocaleDateString()}`)
        );
        console.log(chalk.gray(`   Version: ${track.version}`));
        console.log();
      });
    } catch (error) {
      console.error(
        chalk.red("Error listing tracks:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();

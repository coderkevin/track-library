#!/usr/bin/env node

import { Command } from "commander";
import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { TrackLibrary } from "../core/trackLibrary.js";

const program = new Command();

program
  .name("import")
  .description("Import audio tracks into the library")
  .version("1.0.0")
  .argument("<file>", "Path to audio file to import")
  .action(async (file, options) => {
    try {
      // Check if file exists
      await fs.access(file);

      const spinner = ora("Initializing track library...").start();

      // Initialize track library
      const library = TrackLibrary.getInstance();

      spinner.text = "Extracting metadata...";

      // Extract music metadata first for interactive editing
      const { extractMusicMetadata } = await import(
        "../utils/metadataExtractor.js"
      );
      const musicMetadata = await extractMusicMetadata(file);

      spinner.stop();

      // Interactive metadata editing
      console.log(chalk.green("\nTrack Information:"));
      console.log(chalk.blue("  File:"), file);
      console.log(chalk.blue("  Title:"), musicMetadata.title);
      console.log(chalk.blue("  Artist:"), musicMetadata.artist);
      console.log(chalk.blue("  Album:"), musicMetadata.album);
      console.log(chalk.blue("  Genre:"), musicMetadata.genre);

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "title",
          message: "Title:",
          default: musicMetadata.title,
        },
        {
          type: "input",
          name: "artist",
          message: "Artist:",
          default: musicMetadata.artist,
        },
        {
          type: "input",
          name: "album",
          message: "Album:",
          default: musicMetadata.album,
        },
        {
          type: "input",
          name: "genre",
          message: "Genre:",
          default: musicMetadata.genre,
        },
      ]);

      spinner.start("Importing track...");

      // Import the track with custom metadata
      const metadata = await library.importTrackWithMetadata(file, answers);

      spinner.succeed("Track imported successfully!");

      // Display track information
      console.log("\n" + chalk.green("Track Information:"));
      console.log(chalk.blue("  ID:"), metadata.id);
      console.log(chalk.blue("  Filename:"), metadata.filename);
      console.log(chalk.blue("  Title:"), metadata.title);
      console.log(chalk.blue("  Artist:"), metadata.artist);
      console.log(chalk.blue("  Album:"), metadata.album);
      console.log(chalk.blue("  Genre:"), metadata.genre);
      console.log(
        chalk.blue("  Duration:"),
        `${metadata.duration.toFixed(1)}s`
      );
      console.log(chalk.blue("  Sample Rate:"), `${metadata.sampleRate}Hz`);
      console.log(chalk.blue("  Channels:"), metadata.channels);
      console.log(chalk.blue("  BPM:"), metadata.bpm);
      console.log(chalk.blue("  Key:"), metadata.key);

      console.log(chalk.blue("  Structure:"));
      console.log(chalk.gray("    Parts:"), metadata.structure.parts.length);

      // Show parts details
      if (metadata.structure.parts.length > 0) {
        console.log(chalk.blue("  Parts:"));
        metadata.structure.parts.forEach((part) => {
          const startTime = `${Math.floor(part.start / 60)}:${(part.start % 60)
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

      console.log(chalk.blue("  Loops:"), metadata.loops.length);
      if (metadata.loops.length > 0) {
        console.log(chalk.gray("    Loop Details:"));
        metadata.loops.forEach((loop, index) => {
          console.log(
            chalk.gray(
              `      ${index + 1}. ${loop.name} (${loop.start.toFixed(
                1
              )}s - ${loop.end.toFixed(1)}s)`
            )
          );
        });
      }

      console.log(
        chalk.blue("  Created:"),
        metadata.createdAt.toLocaleString()
      );
      console.log(chalk.blue("  Version:"), metadata.version);
    } catch (error) {
      console.error(
        chalk.red("Error importing track:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();

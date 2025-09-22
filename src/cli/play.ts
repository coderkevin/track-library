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
  .description("Play specific parts of a track for verification")
  .version("1.0.0")
  .argument(
    "<track-identifier>",
    "Track to play (title, artist, or partial match)"
  )
  .option("-p, --part <number>", "Specific part number to play")
  .option("-l, --list", "List all parts without playing")
  .option("-a, --all", "Play all parts sequentially")
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

      if (!track.structure.parts || track.structure.parts.length === 0) {
        console.log(
          chalk.yellow("No parts found for this track. Run analysis first.")
        );
        return;
      }

      // List all parts
      console.log(
        chalk.green(`\nParts for: ${track.title} by ${track.artist}`)
      );
      console.log(
        chalk.blue("Duration:"),
        `${Math.floor(track.duration / 60)}:${(track.duration % 60)
          .toFixed(1)
          .padStart(4, "0")}`
      );
      console.log(chalk.blue("Parts:"), track.structure.parts.length);
      console.log();

      track.structure.parts.forEach((part, index) => {
        const startTime = `${Math.floor(part.start / 60)}:${(part.start % 60)
          .toFixed(1)
          .padStart(4, "0")}`;
        const endTime = `${Math.floor(part.end / 60)}:${(part.end % 60)
          .toFixed(1)
          .padStart(4, "0")}`;
        const duration = part.end - part.start;
        const durationStr = `${Math.floor(duration / 60)}:${(duration % 60)
          .toFixed(1)
          .padStart(4, "0")}`;

        console.log(
          chalk.gray(`  ${part.number}.`),
          `${startTime}-${endTime}`,
          chalk.cyan(`(${part.description})`),
          chalk.gray(`[${durationStr}]`)
        );
      });

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

      if (options.part) {
        // Play specific part
        const partNumber = parseInt(options.part);
        const part = track.structure.parts.find((p) => p.number === partNumber);

        if (!part) {
          console.log(chalk.red(`Part ${partNumber} not found.`));
          return;
        }

        await playPart(track.wavPath, part, partNumber);
      } else if (options.all) {
        // Play all parts sequentially
        console.log(chalk.blue("\nPlaying all parts sequentially..."));
        for (const part of track.structure.parts) {
          console.log(
            chalk.yellow(
              `\n--- Playing Part ${part.number}: ${part.description} ---`
            )
          );
          await playPart(track.wavPath, part, part.number);

          // Ask if user wants to continue
          if (part.number < track.structure.parts.length) {
            console.log(
              chalk.gray(
                "\nPress Enter to continue to next part, or Ctrl+C to stop..."
              )
            );
            await waitForEnter();
          }
        }
        console.log(chalk.green("\nFinished playing all parts!"));
      } else {
        // Interactive mode - let user choose
        console.log(chalk.blue("\nInteractive mode:"));
        console.log(
          chalk.gray(
            "Enter a part number to play, or 'all' to play all parts, or 'q' to quit"
          )
        );
        console.log(
          chalk.gray("Parts will be listed after each play for easy reference.")
        );

        const readline = await import("readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const listParts = () => {
          console.log(chalk.blue("\nAvailable parts:"));
          track.structure.parts.forEach((part, index) => {
            const startTime = `${Math.floor(part.start / 60)}:${(
              part.start % 60
            )
              .toFixed(1)
              .padStart(4, "0")}`;
            const endTime = `${Math.floor(part.end / 60)}:${(part.end % 60)
              .toFixed(1)
              .padStart(4, "0")}`;
            const duration = part.end - part.start;
            const durationStr = `${Math.floor(duration / 60)}:${(duration % 60)
              .toFixed(1)
              .padStart(4, "0")}`;

            console.log(
              chalk.gray(`  ${part.number}.`),
              `${startTime}-${endTime}`,
              chalk.cyan(`(${part.description})`),
              chalk.gray(`[${durationStr}]`)
            );
          });
          console.log();
        };

        const askForPart = () => {
          listParts();
          rl.question(chalk.blue("Part number: "), async (answer) => {
            if (answer.toLowerCase() === "q") {
              rl.close();
              return;
            }

            if (answer.toLowerCase() === "all") {
              rl.close();
              // Play all parts
              for (const part of track.structure.parts) {
                console.log(
                  chalk.yellow(
                    `\n--- Playing Part ${part.number}: ${part.description} ---`
                  )
                );
                await playPart(track.wavPath, part, part.number);
                if (part.number < track.structure.parts.length) {
                  console.log(chalk.gray("\nPress Enter to continue..."));
                  await waitForEnter();
                }
              }
              return;
            }

            const partNumber = parseInt(answer);
            const part = track.structure.parts.find(
              (p) => p.number === partNumber
            );

            if (!part) {
              console.log(chalk.red(`Part ${partNumber} not found.`));
              askForPart();
              return;
            }

            await playPart(track.wavPath, part, partNumber);
            askForPart();
          });
        };

        askForPart();
      }
    } catch (error) {
      console.error(
        chalk.red("Error during playback:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function playPart(wavPath: string, part: any, partNumber: number) {
  const startTime = part.start;
  const duration = part.end - part.start;

  console.log(chalk.blue(`Playing Part ${partNumber}: ${part.description}`));
  console.log(
    chalk.gray(
      `Time: ${Math.floor(startTime / 60)}:${(startTime % 60)
        .toFixed(1)
        .padStart(4, "0")} - ${Math.floor(part.end / 60)}:${(part.end % 60)
        .toFixed(1)
        .padStart(4, "0")}`
    )
  );
  console.log(
    chalk.gray(
      `Duration: ${Math.floor(duration / 60)}:${(duration % 60)
        .toFixed(1)
        .padStart(4, "0")}`
    )
  );

  return new Promise<void>((resolve, reject) => {
    const ffplay = spawn(
      "ffplay",
      [
        "-ss",
        startTime.toString(),
        "-t",
        duration.toString(),
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
        console.log(chalk.green("✓ Part finished playing"));
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

async function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });
}

program.parse();

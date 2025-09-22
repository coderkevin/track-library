#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { getVersion, getVersionInfo } from "../utils/version.js";

const program = new Command();

program
  .name("version")
  .description("Show version information")
  .version("1.0.0")
  .action(() => {
    const versionInfo = getVersionInfo();

    console.log(chalk.green("Track Library Version Information"));
    console.log(chalk.blue("================================="));
    console.log(chalk.blue("Version:"), versionInfo.version);
    console.log(chalk.blue("Build Date:"), versionInfo.buildDate);
    console.log(chalk.blue("Node Version:"), versionInfo.nodeVersion);
  });

program.parse();

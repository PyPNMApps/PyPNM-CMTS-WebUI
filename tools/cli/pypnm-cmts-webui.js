#!/usr/bin/env node

import process from "node:process";

import { runCli } from "./pypnm_cmts_webui_cli.js";

const exitCode = await runCli(process.argv.slice(2), import.meta.url);

if (typeof exitCode === "number") {
  process.exit(exitCode);
}

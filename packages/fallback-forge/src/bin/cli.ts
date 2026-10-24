#!/usr/bin/env node
import path from 'node:path';
import { loadConfig } from '../config.js';
import { inspect } from '../inspect/index.js';
import { generate } from '../generate/index.js';
import { verify } from '../verify/index.js';
import { writeReport } from '../report/index.js';
import type { ResolvedConfig } from '../types.js';

const USAGE = `fallback-forge <command> [options]

Commands
  inspect    Scan the source and render every route; write .fallback-forge/inspect.json
  generate   Build the lightweight companion pages into .fallback-forge/lite/
  verify     Build + preview the site and compare full vs. lightweight with Playwright
  run        inspect, generate, then verify

Options
  --root <dir>       Project root (default: current directory)
  --base-url <url>   Use a running server instead of starting one
  --quiet            Only print the final summary
`;

interface Args {
  command: string;
  root: string;
  baseUrl?: string;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? '', root: process.cwd(), quiet: false };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') args.root = path.resolve(argv[++i] ?? '.');
    else if (a === '--base-url') args.baseUrl = argv[++i];
    else if (a === '--quiet') args.quiet = true;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

type Log = (line: string) => void;
type Command = (cfg: ResolvedConfig, args: Args, log: Log) => Promise<number>;

const COMMANDS: Record<string, Command> = {
  inspect: async (cfg, args, log) => {
    await runInspect(cfg, args, log);
    return 0;
  },
  generate: async (cfg, _args, log) => {
    const result = await generate(cfg, { log });
    return result.flags.some((f) => f.severity === 'error') ? 1 : 0;
  },
  verify: runVerify,
  run: async (cfg, args, log) => {
    await runInspect(cfg, args, log);
    await generate(cfg, { log });
    return runVerify(cfg, args, log);
  },
};

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command || args.command === '--help' || args.command === '-h') {
    process.stdout.write(USAGE);
    return 0;
  }
  const command = COMMANDS[args.command];
  if (!command) {
    process.stderr.write(`Unknown command: ${args.command}\n\n${USAGE}`);
    return 2;
  }
  const log: Log = args.quiet ? () => {} : (line) => process.stdout.write(`${line}\n`);
  return command(await loadConfig(args.root), args, log);
}

async function runInspect(
  cfg: ResolvedConfig,
  args: Args,
  log: (l: string) => void,
): Promise<void> {
  const result = await inspect(cfg, { log, ...(args.baseUrl ? { baseUrl: args.baseUrl } : {}) });
  if (cfg.essentialActions.length === 0) {
    log(
      '\nNo essentialActions in config yet. Proposed actions (review, edit, paste into fallback-forge.config):',
    );
    log(JSON.stringify(result.proposedActions, null, 2));
  } else {
    log(
      `${result.proposedActions.length} proposed actions available in inspect.json (config already declares ${cfg.essentialActions.length}).`,
    );
  }
}

async function runVerify(
  cfg: ResolvedConfig,
  args: Args,
  log: (l: string) => void,
): Promise<number> {
  const report = await verify(cfg, { log, ...(args.baseUrl ? { baseUrl: args.baseUrl } : {}) });
  const files = await writeReport(cfg, report);
  const s = report.summary;
  process.stdout.write(
    [
      '',
      `Result: ${s.ok ? 'PASS' : 'FAIL'}`,
      `  lite essential actions: ${s.liteActionsPassed}/${s.liteActionsTotal}`,
      `  full essential actions: ${s.fullActionsPassed}/${s.fullActionsTotal}`,
      `  lite smaller on every route: ${s.liteSmallerOnEveryRoute ? 'yes' : 'no'}`,
      `  detection switched to lite: ${s.detectionTriggered === null ? 'not checked' : s.detectionTriggered ? 'yes' : 'no'}`,
      `  report: ${files.md}`,
      '',
    ].join('\n'),
  );
  return s.ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err: Error) => {
    process.stderr.write(`fallback-forge: ${err.message}\n`);
    process.exit(1);
  });

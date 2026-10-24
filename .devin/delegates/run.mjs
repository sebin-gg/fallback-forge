#!/usr/bin/env node
// Cavecrew-style delegates on external CLIs. Output contracts are compressed so
// only a short, structured result returns to the orchestrating agent's context.
//
//   node .devin/delegates/run.mjs investigate "<question>"      # Copilot, read-only
//   node .devin/delegates/run.mjs build       "<task>"          # Grok Build grok-4.7, may edit + run commands
//   node .devin/delegates/run.mjs review      "<what to review>" # Grok Build grok-4.7, findings only
//
// Options: --cwd <dir> (default: repo root), --model <id> (override), --file <path> (task from file)
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

const PREAMBLE = readFileSync(path.join(here, 'preamble.md'), 'utf8');
const CONTRACTS = {
  investigate: readFileSync(path.join(here, 'investigator.md'), 'utf8'),
  build: readFileSync(path.join(here, 'builder.md'), 'utf8'),
  review: readFileSync(path.join(here, 'reviewer.md'), 'utf8'),
};

const DEFAULT_MODEL = { investigate: 'auto', build: 'grok-4.7', review: 'grok-4.7' };

function parse(argv) {
  const [mode, ...rest] = argv;
  const opts = { mode, cwd: repoRoot, model: DEFAULT_MODEL[mode], task: '' };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--cwd') opts.cwd = path.resolve(rest[++i]);
    else if (a === '--model') opts.model = rest[++i];
    else if (a === '--file') opts.task = readFileSync(rest[++i], 'utf8');
    else opts.task += (opts.task ? ' ' : '') + a;
  }
  if (!CONTRACTS[mode] || !opts.task) {
    console.error(
      'usage: run.mjs <investigate|build|review> "<task>" [--cwd dir] [--model id] [--file path]',
    );
    process.exit(2);
  }
  return opts;
}

function prompt(opts) {
  return `${PREAMBLE}\n\n${CONTRACTS[opts.mode]}\n\n## Task\n\n${opts.task}\n`;
}

// Prompts are long; Windows command lines are not. Always hand the prompt over as a file / stdin.
function command(opts) {
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'ff-delegate-')), 'prompt.md');
  writeFileSync(file, prompt(opts), 'utf8');
  if (opts.mode === 'investigate') {
    // Copilot CLI: read-only scout. `auto` resolves to the plan's included model. Prompt via stdin.
    return {
      bin: 'copilot',
      args: ['-s', '--model', opts.model, '--allow-all-tools'],
      json: false,
      stdinFile: file,
    };
  }
  // Grok Build: full autonomy inside cwd; JSON output so we can extract only the text.
  return {
    bin: 'agent',
    args: [
      '--prompt-file',
      file,
      '-m',
      opts.model,
      '--always-approve',
      '--output-format',
      'json',
      '--cwd',
      opts.cwd,
    ],
    json: true,
  };
}

function run(opts) {
  const { bin, args, json, stdinFile } = command(opts);
  const child = spawn(bin, args, {
    cwd: opts.cwd,
    shell: process.platform === 'win32',
    stdio: [stdinFile ? 'pipe' : 'ignore', 'pipe', 'pipe'],
  });
  if (stdinFile) child.stdin.end(readFileSync(stdinFile));
  let out = '';
  let err = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (err += d));
  child.on('close', (code) => {
    process.stdout.write(json ? formatJson(out, opts.model) : out.trim() + '\n');
    if (code !== 0) process.stderr.write(tailErrors(err));
    process.exit(code ?? 1);
  });
}

function formatJson(out, model) {
  try {
    const j = JSON.parse(out);
    const u = j.usage ?? {};
    const text = (j.text ?? '').trim();
    return `${text}\n-- ${model} | in ${u.input_tokens ?? '?'} out ${u.output_tokens ?? '?'} | turns ${j.num_turns ?? '?'} | stop ${j.stopReason ?? '?'}\n`;
  } catch {
    return out.trim() + '\n';
  }
}

function tailErrors(err) {
  return (
    err
      .split('\n')
      .filter((l) => !/Skill conflict|True color/.test(l))
      .slice(-5)
      .join('\n') + '\n'
  );
}

run(parse(process.argv.slice(2)));

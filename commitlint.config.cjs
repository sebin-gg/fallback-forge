// Conventional Commits, plus `wip` for honest in-progress checkpoints
// (AGENTS.md §2.3 / §3.1).
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'a11y',
        'chore',
        'docs',
        'test',
        'refactor',
        'ci',
        'build',
        'style',
        'revert',
        'wip',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};

# CLAUDE.md

Project context for Claude Code working in this repo.

## What this repo is

**X Vizier** — a Next.js analytics tool for X (Twitter) that helps the owner (Shane / @Tuteth_) understand which content performs and why. See `README.md` for the product overview.

The repo doubles as a personal content playbook: data, learnings, and style rules for drafting X posts.

## Content tasks (drafting, reviewing, copy-editing tweets)

**Before drafting, rewriting, or copy-editing any tweet, read `data/X_Content_Learnings_For_Claude_Code.md` and apply it.**

That file contains:
- Performance benchmarks (avg impressions, viral threshold)
- Content categories ranked by performance
- Best/worst posting days
- Length data (long-form is 2.3x better)
- Top 5 proven formulas
- **Style Rules (hard constraints)** — currently includes a no-em-dash rule

The Style Rules section is non-negotiable. If a rule says "no X," never produce X in any draft, rewrite, or example, even when illustrating an alternative.

## Code tasks

Standard Next.js 14 / TypeScript / Tailwind project. See `README.md` for structure and API endpoints. No special conventions beyond what's already in the codebase.

## Data files

`/data` contains real analytics exports and the content playbook. Treat CSV/XLSX files as read-only reference data. The playbook markdown (`X_Content_Learnings_For_Claude_Code.md`) is the canonical source for content rules — update it there when adding new learnings or style constraints.

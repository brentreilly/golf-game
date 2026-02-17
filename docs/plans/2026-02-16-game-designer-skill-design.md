# Game Designer Skill — Design

## Summary

A Claude Code skill (`~/.claude/skills/game-designer/SKILL.md`) that guides conversational game design for Hudson's Arcade. Takes a vague idea and produces a complete game concept document tailored for Hudson (age 6-7) and his Amazon Fire HD tablet.

## Trigger Conditions

- "design a game for Hudson"
- "new arcade game"
- "game idea for the arcade"
- "what game should we build next"

## Conversational Design Flow

1. **Theme exploration** — What inspired the idea? One question at a time.
2. **Core mechanic** — The one thing you DO (tap, swipe, drag, tilt). Must be instantly understandable.
3. **Fun loop** — What makes it replayable? Short sessions (2-5 min/round).
4. **Controls & tablet fit** — Touch-first. Min 48px targets, no hover, no tiny text.
5. **Difficulty & forgiveness** — Generous hit boxes, no harsh penalties, visual rewards for progress.
6. **Visual style** — Fits retro arcade aesthetic. Canvas 2D, Three.js, or pure CSS.
7. **Output** — Design doc at `docs/plans/YYYY-MM-DD-<game-name>-design.md`.

## Design Principles Enforced

- **Instant feedback** — Every tap/swipe produces visible/audible response
- **Low floor, high ceiling** — Easy to start, room to master
- **Session length** — 2-5 minutes per round
- **Reading minimal** — Icons/emojis over text, big visual cues
- **Forgiving** — No "game over" dead ends; always a way to keep playing
- **Fire HD performance** — No heavy particle systems, limit draw calls

## Tech Constraints (from arcade)

- Zero build step — vanilla HTML/CSS/JS, ES modules via CDN import maps
- Each game self-contained in `games/<slug>/`
- Tablet-first — large touch targets, no hover-dependent interactions
- Must perform well on low-end Android hardware (Fire HD)

## Approach

Pure skill (no subagent, no reference file). Lightweight, integrates with existing `/brainstorm` → `/build` workflow.

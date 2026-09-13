# Memory Engine

A memory layer for AI agents that knows what it knows, what it doesn't, and when to forget. Built for the DOO Builders League "Memory That Knows It Might Be Wrong" challenge.

Instead of treating every remembered fact as permanently true, this system tags each memory with a **source**, a **confidence level**, a **freshness** timestamp, and a **scope** (who/what it applies to). When a memory is retrieved, the system shows how sure it actually is — and openly warns when a memory might be outdated, low-confidence, or contradicted.

## Live demo

**https://memory-engine-1.onrender.com**

(Free hosting tier — the first request after a period of inactivity can take 30-50 seconds to wake up.)

## What it does

Three real-world domains are wired into the same core memory engine:

- **User preferences** — a personal assistant remembering things about a user (and updating cleanly when something changes, like moving cities)
- **Support history** — customer support remembering a customer's past issues, including vague low-confidence ones
- **Project knowledge** — a team's shared memory about a project, the kind of fact that quietly goes stale (like an old config value)

Every domain writes into the same engine, which handles three paths:

- **Write** — store a new fact; if it replaces an old one, the old one is marked `contradicted`, not deleted
- **Retrieve** — return facts for a given scope, with confidence adjusted for age and a warning attached when something might be wrong
- **Forget** — explicitly revoke a memory (e.g. the user asked to delete it), with a reason recorded

A built-in **memory inspector** ("what do you remember about me?") shows everything for a scope, including contradicted and revoked memories, so nothing is hidden.

## Running it locally

```bash
git clone https://github.com/manar-13/memory-engine.git
cd memory-engine
npm install
npm start
```

Then open `http://localhost:3000` in your browser.

To run the automated tests:

```bash
npx vitest run
```

No API keys, no `.env` file, and no external accounts are required — everything runs with mock, in-memory data.

## Project structure

```
src/
  memory/
    types.ts       — shared data shapes (a memory fact, write input, retrieval result)
    memoryStore.ts  — the core engine: write, retrieve, and forget logic
  domains/
    userPreferences.ts    — turns a user preference into a memory
    supportHistory.ts     — turns a support issue into a memory
    projectKnowledge.ts   — turns a project fact into a memory
  server.ts          — the web server + API endpoints
public/
  index.html         — the live demo page
tests/
  memoryStore.test.ts — automated tests covering the engine and all 3 domains
```

See `ARCHITECTURE.md` for a diagram of the write/retrieval/forgetting paths, `FAILURE_TEST.md` for a deliberate edge case and what happens when it's hit, `THESIS.md` for where I think agent memory is headed, and `EXPLANATION.md` for a full walkthrough of the design decisions behind this project.

## Why this design

Most "memory" for AI agents is really just a database that never says "I'm not sure." This engine treats confidence and forgetting as first-class citizens, not an afterthought: a memory that's gone stale or been contradicted should say so out loud, not sit there quietly being wrong.

## What I'd improve with more time

- Persist memories to a real database instead of an in-memory list (currently resets if the server restarts)
- Let a domain automatically detect contradictions (currently the caller has to say "this contradicts fact X")
- Add per-scope privacy controls so a user can revoke all memories about themselves in one action
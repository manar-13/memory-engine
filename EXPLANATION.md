# Project Explanation

This document explains how this memory engine works and why it's built the way it is. It's written for anyone reviewing the code — a mentor, a judge, or a future version of me — who wants to understand the design decisions behind it, not just read the code line by line.

## What this project does

This is a memory layer for AI agents. Instead of storing facts as permanently true, it tags every memory with a source, a confidence level, a freshness timestamp, and a scope (who or what it applies to). When something asks to retrieve a memory, the system doesn't just hand it back — it checks how old and how confident the memory is, and attaches a warning when it might be wrong. There's also an explicit way to forget things, with a reason recorded, so nothing disappears silently.

Three real domains are wired into it: a personal assistant's memory of user preferences, customer support's memory of past issues, and a team's shared memory of project facts.

## Why the code is split into `memory/` and `domains/`

`src/memory/` contains the only two files that know anything about *how memory works*: `types.ts` defines the shared shapes, and `memoryStore.ts` contains the write, retrieve, and forget logic. Neither file has ever heard of a user preference, a support ticket, or a project fact.

`src/domains/` contains one file per real-world situation. Each domain's entire job is to translate its own kind of input into the shared shape the engine understands, tagged with a scope like `user:<id>` or `project:<id>`. A domain never decides how confident to be about staleness or what counts as "too old" — it only describes the situation and hands it to the engine.

I chose this split for the same reason I chose it on my last project (a decision engine): the part that actually matters — how memory ages, how contradictions are handled, how forgetting works — should live in exactly one place. If I ever need every domain to treat memories as stale after 60 days instead of 90, I change one constant in `memoryStore.ts`, and every domain inherits it automatically.

## Why these specific fields

I settled on four things to tag every memory with — source, confidence, freshness, and scope — because together they answer the questions a system actually needs before trusting its own memory: *where did this come from, how sure was I, is this still current, and who does this even apply to?* Status (`active`, `contradicted`, `stale`, `revoked`) is a fifth piece: it's the memory's own life story, not just a snapshot.

## Why forgetting is a status change, not a delete

`forgetFact()` doesn't remove a memory from the list — it marks it `revoked` and records why. Same with contradiction: an old fact isn't deleted when a new one replaces it, it's marked `contradicted`. I did this because a memory system that can silently erase its own history can't be audited later. If someone asks "did you know X was wrong the whole time, or did you just delete it?", this system can actually answer that question, because nothing is ever truly gone — it's just relabeled.

## Testing philosophy

`tests/memoryStore.test.ts` tests the engine directly (writing, low-confidence warnings, contradiction handling, staleness after time passes, revoking) and then tests each domain's wiring separately, the same two-layer approach I used on my last project. The staleness test uses `vi.useFakeTimers()` to fast-forward time by several months instead of actually waiting — a small trick, but it's the only way to test a time-based rule without a very patient test suite.

## The failure test, and what it taught me

When I went looking for a way to break my own system, I found something more revealing than a crash: I can write two directly contradicting facts about the same person — "lives in Manama" and "lives in Riffa" — and if I don't explicitly tell the engine they conflict, it happily keeps both as `active`, both at full confidence, with zero warning that anything is wrong. That's because contradiction detection in this system is manual: it only happens when the caller says so. Nothing compares two facts by their meaning.

This is a direct sibling of a gap I found in my last project, where a decision engine could be gamed by splitting one risky action into several small ones because it had no memory across calls. Same shape of problem in a different place: a system that handles each individual piece of information reasonably, but has no way to notice when those pieces disagree with each other as a whole.

## What I'd still improve given more time

- Give the engine a way to compare facts by topic, not just by ID, so contradictions can be caught automatically instead of requiring the caller to already know about them
- Persist memories to a real database instead of an in-memory list
- Build a proper privacy-revocation flow where a user can wipe every memory about themselves in a single action, with a receipt showing exactly what was removed

## How this project came together

This is my third build in the Builders League program. My first project (a Google Sheets connector) taught me to design safety mechanisms that can't be skipped by accident. My second project (a decision engine) taught me to look for the sneakier version of that problem — a system that never skips a step, but can still be exploited because it treats every call in isolation. This project is a direct continuation of that lesson: I built a system whose entire purpose is admitting uncertainty and forgetting responsibly, and then found that its biggest blind spot is the exact same shape of gap — pieces that look fine individually, but were never checked against each other.
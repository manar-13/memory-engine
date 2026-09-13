# Deliberate Failure Test

## The attack: two contradicting memories, both "active" at once

The engine only marks an old fact `contradicted` when the caller explicitly says "this new fact replaces that old one" (by passing `contradictsFactId`). It never checks on its own whether a new fact actually disagrees with an existing one. If nobody points out the contradiction, the engine has no way to notice it happened.

### The setup

Write two directly conflicting facts about the same user, one right after the other, **without** passing `contradictsFactId` the second time (simulating a caller who didn't bother to check what was already stored — a very realistic case, since checking requires an extra lookup most implementations will skip under time pressure):

```bash
curl -s -X POST https://memory-engine-1.onrender.com/api/preferences \
  -H "Content-Type: application/json" \
  -d '{"userId":"contradiction-test","content":"lives in Manama","source":"chat, June","confidence":0.85}'

curl -s -X POST https://memory-engine-1.onrender.com/api/preferences \
  -H "Content-Type: application/json" \
  -d '{"userId":"contradiction-test","content":"lives in Riffa","source":"chat, September","confidence":0.85}'

curl -s https://memory-engine-1.onrender.com/api/preferences/contradiction-test
```

### What actually happens

Both facts come back from `retrieveFacts`, both marked `active`, both at 85% confidence, with **no warning at all**. The system will confidently tell you the user "lives in Manama" and "lives in Riffa" in the same breath, and treat both as equally true — because nothing ever told it these two facts can't both hold at once.

### Why this happens

Two root causes:

1. **Contradiction detection is manual, not automatic.** `writeFact()` only marks an old fact `contradicted` if it's handed that fact's exact ID. It has no idea that two facts in the same scope might be about the same underlying thing ("where the user lives") unless a human or an upstream system already worked that out.
2. **No semantic comparison between facts.** The engine compares facts by ID, never by content. Two facts that are obviously about the same topic, in plain English, are invisible to each other unless something outside the engine links them.

### What I'd do about it

The real fix isn't a bigger `if` statement — it's giving each domain a way to check "do I already have a fact like this, for this scope?" before writing a new one, ideally using the fact's *topic* (e.g. "user's city") rather than free-text matching, which is a hard problem on its own. Until that exists, this system quietly allows contradictory beliefs to coexist, which is arguably worse than a single wrong-but-confident answer, because nothing about the retrieval response signals that anything is off.

I'm including this honestly because it's a real, current gap — not a strawman. A memory system that claims to "know what it doesn't know" should be judged on whether it catches exactly this kind of quiet contradiction, and right now, mine doesn't.
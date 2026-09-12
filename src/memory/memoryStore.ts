import { MemoryFact, WriteFactInput, RetrievedFact, MemoryStatus } from "./types";

const STALE_AFTER_DAYS = 90;      // after this many days unconfirmed, we warn it might be outdated
const LOW_CONFIDENCE = 0.5;       // below this, we always warn

const memories: MemoryFact[] = [];

function daysSince(dateStr: string): number {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    return (now - then) / (1000 * 60 * 60 * 24);
}

// --- WRITE PATH ---
// Adds a new memory. If it contradicts an existing one, the old one is marked "contradicted" (not deleted).
export function writeFact(input: WriteFactInput, contradictsFactId?: string): MemoryFact {
    const baseDate = input.backdateDays
        ? new Date(Date.now() - input.backdateDays * 24 * 60 * 60 * 1000)
        : new Date();
    const now = baseDate.toISOString();

    if (contradictsFactId) {
        const old = memories.find(m => m.id === contradictsFactId);
        if (old && old.status === "active") {
            old.status = "contradicted";
        }
    }

    const fact: MemoryFact = {
        id: crypto.randomUUID(),
        content: input.content,
        source: input.source,
        confidence: input.confidence,
        scope: input.scope,
        createdAt: now,
        lastConfirmedAt: now,
        status: "active",
    };
    memories.push(fact);
    return fact;
}

// --- RETRIEVAL PATH ---
// Returns only active memories for a given scope, with confidence adjusted for age and a warning if it's shaky.
export function retrieveFacts(scope: string): RetrievedFact[] {
    return memories
        .filter(m => m.scope === scope && m.status === "active")
        .map(m => {
            const age = daysSince(m.lastConfirmedAt);
            let effectiveConfidence = m.confidence;
            let warning: string | undefined;

            if (age > STALE_AFTER_DAYS) {
                effectiveConfidence = Math.max(0.1, m.confidence - 0.4);
                warning = `This is from ${Math.floor(age)} days ago. It might be outdated.`;
            } else if (m.confidence < LOW_CONFIDENCE) {
                warning = `I'm not very confident about this (${(m.confidence * 100).toFixed(0)}%).`;
            }

            return { fact: m, effectiveConfidence, warning };
        });
}

// --- FORGETTING PATH ---
// Explicitly revokes a memory (e.g. the user asked to delete it, or it's confirmed stale).
export function forgetFact(id: string, reason: string): MemoryFact | undefined {
    const fact = memories.find(m => m.id === id);
    if (fact) {
        fact.status = "revoked";
        fact.revokedReason = reason;
    }
    return fact;
}

// For the "what do you remember about me" inspector — shows everything, including contradicted/revoked, for transparency.
export function getAllFacts(scope?: string): MemoryFact[] {
    return scope ? memories.filter(m => m.scope === scope) : [...memories];
}
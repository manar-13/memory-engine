// The 4 kinds of things that can happen to a memory over time.
export type MemoryStatus = "active" | "contradicted" | "stale" | "revoked";

export interface MemoryFact {
    id: string;
    content: string;          // the actual fact, in plain words
    source: string;           // where this fact came from
    confidence: number;       // 0 to 1, how sure we are
    scope: string;            // who/what this applies to, e.g. "user:manar" or "project:sheets-connector"
    createdAt: string;        // when it was first learned
    lastConfirmedAt: string;  // when it was last seen/confirmed as still true
    status: MemoryStatus;
    contradictedBy?: string;  // id of the fact that contradicts this one, if any
    revokedReason?: string;   // why it was revoked, if it was
}

export interface WriteFactInput {
    content: string;
    source: string;
    confidence: number;
    scope: string;
    backdateDays?: number;  // for demo purposes: pretend this memory is X days old
}

export interface RetrievedFact {
    fact: MemoryFact;
    effectiveConfidence: number;  // confidence, adjusted for age
    warning?: string;             // e.g. "this is old" or "this might be wrong"
}
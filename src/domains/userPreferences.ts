import { writeFact, retrieveFacts } from "../memory/memoryStore";
import { WriteFactInput, RetrievedFact } from "../memory/types";

export interface RememberPreferenceInput {
    userId: string;
    content: string;      // e.g. "prefers window seats"
    source: string;       // e.g. "said in chat on Sept 1"
    confidence: number;
    contradictsFactId?: string;  // pass this if it replaces an older preference
}

export function rememberPreference(input: RememberPreferenceInput) {
    const factInput: WriteFactInput = {
        content: input.content,
        source: input.source,
        confidence: input.confidence,
        scope: `user:${input.userId}`,
    };
    return writeFact(factInput, input.contradictsFactId);
}

export function getPreferences(userId: string): RetrievedFact[] {
    return retrieveFacts(`user:${userId}`);
}
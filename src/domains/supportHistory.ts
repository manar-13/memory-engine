import { writeFact, retrieveFacts } from "../memory/memoryStore";
import { WriteFactInput, RetrievedFact } from "../memory/types";

export interface RecordSupportIssueInput {
    customerId: string;
    content: string;      // e.g. "reported login failures on mobile app"
    source: string;       // e.g. "support ticket #4821"
    confidence: number;
    contradictsFactId?: string;  // e.g. issue was later found to be resolved/wrong diagnosis
}

export function recordSupportIssue(input: RecordSupportIssueInput) {
    const factInput: WriteFactInput = {
        content: input.content,
        source: input.source,
        confidence: input.confidence,
        scope: `customer:${input.customerId}`,
    };
    return writeFact(factInput, input.contradictsFactId);
}

export function getSupportHistory(customerId: string): RetrievedFact[] {
    return retrieveFacts(`customer:${customerId}`);
}
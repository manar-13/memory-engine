import { writeFact, retrieveFacts } from "../memory/memoryStore";
import { WriteFactInput, RetrievedFact } from "../memory/types";

export interface RecordProjectFactInput {
    projectId: string;
    content: string;
    source: string;
    confidence: number;
    contradictsFactId?: string;
    backdateDays?: number;
}

export function recordProjectFact(input: RecordProjectFactInput) {
    const factInput: WriteFactInput = {
        content: input.content,
        source: input.source,
        confidence: input.confidence,
        scope: `project:${input.projectId}`,
        backdateDays: input.backdateDays,
    };
    return writeFact(factInput, input.contradictsFactId);
}

export function getProjectKnowledge(projectId: string): RetrievedFact[] {
    return retrieveFacts(`project:${projectId}`);
}
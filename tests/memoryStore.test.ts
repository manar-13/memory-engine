import { describe, it, expect, vi } from "vitest";
import { writeFact, retrieveFacts, forgetFact, getAllFacts } from "../src/memory/memoryStore";
import { rememberPreference, getPreferences } from "../src/domains/userPreferences";
import { recordSupportIssue, getSupportHistory } from "../src/domains/supportHistory";
import { recordProjectFact, getProjectKnowledge } from "../src/domains/projectKnowledge";

describe("memory engine", () => {
    it("writes an active fact", () => {
        const fact = writeFact({ content: "likes tea", source: "chat", confidence: 0.9, scope: "user:test1" });
        expect(fact.status).toBe("active");
    });

    it("retrieves active facts with high confidence and no warning", () => {
        writeFact({ content: "works remotely", source: "chat", confidence: 0.95, scope: "user:test2" });
        const results = retrieveFacts("user:test2");
        expect(results.length).toBe(1);
        expect(results[0].warning).toBeUndefined();
    });

    it("warns on low confidence", () => {
        writeFact({ content: "might like coffee", source: "guess", confidence: 0.3, scope: "user:test3" });
        const results = retrieveFacts("user:test3");
        expect(results[0].warning).toContain("not very confident");
    });

    it("marks old facts contradicted when a new one supersedes them", () => {
        const old = writeFact({ content: "lives in Manama", source: "chat", confidence: 0.8, scope: "user:test4" });
        writeFact({ content: "lives in Riffa", source: "chat", confidence: 0.9, scope: "user:test4" }, old.id);
        const results = retrieveFacts("user:test4");
        expect(results.length).toBe(1);
        expect(results[0].fact.content).toBe("lives in Riffa");
        const all = getAllFacts("user:test4");
        expect(all.find(f => f.id === old.id)?.status).toBe("contradicted");
    });

    it("marks a fact stale and warns after the freshness window", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01"));
        writeFact({ content: "port is 4000", source: "README", confidence: 0.9, scope: "project:test1" });
        vi.setSystemTime(new Date("2026-05-01"));
        const results = retrieveFacts("project:test1");
        expect(results[0].warning).toContain("outdated");
        vi.useRealTimers();
    });

    it("revokes a fact and excludes it from retrieval", () => {
        const fact = writeFact({ content: "phone number is X", source: "form", confidence: 1, scope: "user:test5" });
        forgetFact(fact.id, "user requested deletion");
        const results = retrieveFacts("user:test5");
        expect(results.length).toBe(0);
        const all = getAllFacts("user:test5");
        expect(all.find(f => f.id === fact.id)?.status).toBe("revoked");
    });
});

describe("domains", () => {
    it("wires user preferences correctly", () => {
        rememberPreference({ userId: "manar", content: "prefers dark mode", source: "settings", confidence: 0.9 });
        expect(getPreferences("manar").length).toBe(1);
    });

    it("wires support history correctly", () => {
        recordSupportIssue({ customerId: "c100", content: "billing issue", source: "ticket #1", confidence: 0.8 });
        expect(getSupportHistory("c100").length).toBe(1);
    });

    it("wires project knowledge correctly", () => {
        recordProjectFact({ projectId: "p1", content: "uses Postgres", source: "docs", confidence: 0.95 });
        expect(getProjectKnowledge("p1").length).toBe(1);
    });
});
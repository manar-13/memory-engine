import express from "express";
import path from "path";
import { rememberPreference, getPreferences } from "./domains/userPreferences";
import { recordSupportIssue, getSupportHistory } from "./domains/supportHistory";
import { recordProjectFact, getProjectKnowledge } from "./domains/projectKnowledge";
import { forgetFact, getAllFacts } from "./memory/memoryStore";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// --- User preferences ---
app.post("/api/preferences", (req, res) => {
    try {
        const fact = rememberPreference(req.body);
        res.json(fact);
    } catch (err) {
        res.status(400).json({ error: "Invalid input" });
    }
});
app.get("/api/preferences/:userId", (req, res) => {
    res.json(getPreferences(req.params.userId));
});

// --- Support history ---
app.post("/api/support", (req, res) => {
    try {
        const fact = recordSupportIssue(req.body);
        res.json(fact);
    } catch (err) {
        res.status(400).json({ error: "Invalid input" });
    }
});
app.get("/api/support/:customerId", (req, res) => {
    res.json(getSupportHistory(req.params.customerId));
});

// --- Project knowledge ---
app.post("/api/project", (req, res) => {
    try {
        const fact = recordProjectFact(req.body);
        res.json(fact);
    } catch (err) {
        res.status(400).json({ error: "Invalid input" });
    }
});
app.get("/api/project/:projectId", (req, res) => {
    res.json(getProjectKnowledge(req.params.projectId));
});

// --- Forgetting (works for any memory, by id) ---
app.post("/api/forget", (req, res) => {
    const { id, reason } = req.body;
    const fact = forgetFact(id, reason);
    res.json(fact ?? { error: "Not found" });
});

// --- Memory inspector: "what do you remember about me?" ---
app.get("/api/inspect/:scope", (req, res) => {
    res.json(getAllFacts(req.params.scope));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`memory-engine is live on port ${PORT}`);
});
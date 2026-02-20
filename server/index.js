/**
 * GestureCtrl — Node.js API Server + WebSocket Bridge
 * Express REST API on port 3001, WebSocket bridge between browser clients and Python ML service.
 */

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, "..", "data");
const GESTURES_FILE = path.join(DATA_DIR, "gestures.json");
const GESTURES_SAMPLES_DIR = path.join(DATA_DIR, "gestures");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GESTURES_SAMPLES_DIR))
    fs.mkdirSync(GESTURES_SAMPLES_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Gesture persistence
// ---------------------------------------------------------------------------
function loadGestures() {
    try {
        if (fs.existsSync(GESTURES_FILE)) {
            return JSON.parse(fs.readFileSync(GESTURES_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("[API] Failed to load gestures:", e.message);
    }
    return {};
}

function saveGestures(gestures) {
    fs.writeFileSync(GESTURES_FILE, JSON.stringify(gestures, null, 2), "utf-8");
}

let gestures = loadGestures();

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ---------------------------------------------------------------------------
// REST API Routes
// ---------------------------------------------------------------------------

// GET /api/gestures — list all gestures
app.get("/api/gestures", (req, res) => {
    res.json({ gestures });
});

// POST /api/gestures — add a new gesture
app.post("/api/gestures", (req, res) => {
    const { name, icon, action, cursorAction } = req.body;
    if (!name || !action) {
        return res.status(400).json({ error: "name and action are required" });
    }
    const id = uuidv4().slice(0, 8);
    const gesture = {
        name,
        icon: icon || "✋",
        action,
        active: true,
        samples: 0,
        createdAt: new Date().toISOString(),
    };
    
    // Add cursor action if this is a cursor gesture
    if (cursorAction) {
        gesture.cursorAction = cursorAction;
    }
    
    gestures[id] = gesture;
    saveGestures(gestures);

    // Notify ML service
    sendToML({ type: "add_gesture", id, data: gesture });

    // Broadcast to all browser clients
    broadcastToClients({ type: "gesture_updated", gestures });

    res.status(201).json({ id, gesture });
});

// PATCH /api/gestures/:id — update a gesture
app.patch("/api/gestures/:id", (req, res) => {
    const { id } = req.params;
    const { name, icon, action, cursorAction } = req.body;
    
    if (!gestures[id]) {
        return res.status(404).json({ error: "Gesture not found" });
    }
    
    // Update gesture properties
    if (name) gestures[id].name = name;
    if (icon) gestures[id].icon = icon;
    if (action) gestures[id].action = action;
    if (cursorAction) gestures[id].cursorAction = cursorAction;
    
    saveGestures(gestures);

    // Notify ML service
    sendToML({ type: "update_gesture", id, data: gestures[id] });

    // Broadcast to all browser clients
    broadcastToClients({ type: "gesture_updated", gestures });

    res.json({ id, gesture: gestures[id] });
});

// DELETE /api/gestures/:id — delete a gesture
app.delete("/api/gestures/:id", (req, res) => {
    const { id } = req.params;
    if (!gestures[id]) {
        return res.status(404).json({ error: "Gesture not found" });
    }
    delete gestures[id];
    saveGestures(gestures);

    // Delete sample files
    const sampleDir = path.join(GESTURES_SAMPLES_DIR, id);
    if (fs.existsSync(sampleDir)) {
        fs.rmSync(sampleDir, { recursive: true, force: true });
    }

    // Notify ML service
    sendToML({ type: "delete_gesture", id });

    // Broadcast
    broadcastToClients({ type: "gesture_updated", gestures });

    res.json({ success: true });
});

// PATCH /api/gestures/:id/toggle — toggle gesture active state
app.patch("/api/gestures/:id/toggle", (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    if (!gestures[id]) {
        return res.status(404).json({ error: "Gesture not found" });
    }
    gestures[id].active = active !== undefined ? active : !gestures[id].active;
    saveGestures(gestures);

    sendToML({ type: "toggle_gesture", id, active: gestures[id].active });
    broadcastToClients({ type: "gesture_updated", gestures });

    res.json({ id, active: gestures[id].active });
});

// POST /api/camera/start — start the camera
app.post("/api/camera/start", (req, res) => {
    sendToML({ type: "camera_start" });
    res.json({ status: "starting" });
});

// POST /api/camera/stop — stop the camera
app.post("/api/camera/stop", (req, res) => {
    sendToML({ type: "camera_stop" });
    res.json({ status: "stopping" });
});

// POST /api/train — trigger model retraining
app.post("/api/train", (req, res) => {
    sendToML({ type: "retrain" });
    res.json({ status: "training" });
});

// POST /api/gestures/:id/record — start sample recording
app.post("/api/gestures/:id/record", (req, res) => {
    const { id } = req.params;
    const total = req.body.total || 80;
    if (!gestures[id]) {
        return res.status(404).json({ error: "Gesture not found" });
    }
    sendToML({ type: "start_recording", id, total });
    res.json({ status: "recording", id, total });
});

// POST /api/gestures/:id/stop-record — stop sample recording
app.post("/api/gestures/:id/stop-record", (req, res) => {
    sendToML({ type: "stop_recording" });
    res.json({ status: "stopped" });
});

// POST /api/settings — update ML settings
app.post("/api/settings", (req, res) => {
    sendToML({ type: "update_settings", ...req.body });
    res.json({ status: "updated" });
});

// GET /api/stats — get ML stats
app.get("/api/stats", (req, res) => {
    sendToML({ type: "get_stats" });
    // Stats come back via WebSocket — client will receive them there
    res.json({ status: "requested" });
});

// ---------------------------------------------------------------------------
// WebSocket — Client Pool (browser tabs)
// ---------------------------------------------------------------------------
const wss = new WebSocket.Server({ noServer: true });
const clientSockets = new Set();

wss.on("connection", (ws) => {
    clientSockets.add(ws);
    console.log(`[WS] Browser client connected (${clientSockets.size} total)`);

    // Send initial state
    ws.send(
        JSON.stringify({
            type: "connected",
            gestures,
            mlConnected: mlSocket !== null && mlSocket.readyState === WebSocket.OPEN,
        })
    );

    ws.on("message", (raw) => {
        // Forward commands to ML service
        try {
            const data = JSON.parse(raw.toString());
            sendToML(data);
        } catch (e) {
            console.error("[WS] Invalid message from client:", e.message);
        }
    });

    ws.on("close", () => {
        clientSockets.delete(ws);
        console.log(
            `[WS] Browser client disconnected (${clientSockets.size} remaining)`
        );
    });
});

function broadcastToClients(message) {
    const data = JSON.stringify(message);
    for (const ws of clientSockets) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    }
}

// ---------------------------------------------------------------------------
// WebSocket — ML Service Connection (Python)
// ---------------------------------------------------------------------------
let mlSocket = null;
let mlReconnectTimer = null;
const ML_WS_URL = "ws://localhost:8765";

function connectToML() {
    if (mlSocket && mlSocket.readyState === WebSocket.OPEN) return;

    console.log("[ML] Connecting to Python ML service...");
    try {
        mlSocket = new WebSocket(ML_WS_URL);
    } catch (e) {
        console.error("[ML] Connection error:", e.message);
        scheduleMLReconnect();
        return;
    }

    mlSocket.on("open", () => {
        console.log("[ML] ✓ Connected to Python ML service");
        broadcastToClients({ type: "ml_status", connected: true });

        // Re-sync gestures to ML
        for (const [id, data] of Object.entries(gestures)) {
            sendToML({ type: "add_gesture", id, data });
        }
    });

    mlSocket.on("message", (raw) => {
        const msgStr = raw.toString();

        // Forward frame events directly to clients without re-parsing for speed
        // But parse non-frame events to handle them
        try {
            const data = JSON.parse(msgStr);

            // Update local sample counts when recording completes
            if (data.type === "recording_progress" && data.id && gestures[data.id]) {
                gestures[data.id].samples = data.recorded;
                if (!data.active) {
                    saveGestures(gestures);
                }
            }

            // Forward stats to requesting client
            if (data.type === "stats") {
                broadcastToClients(data);
                return;
            }
        } catch (e) {
            // If parsing fails, still forward
        }

        // Forward everything to browser clients
        for (const ws of clientSockets) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(msgStr);
            }
        }
    });

    mlSocket.on("close", () => {
        console.log("[ML] Disconnected from Python ML service");
        mlSocket = null;
        broadcastToClients({ type: "ml_status", connected: false });
        scheduleMLReconnect();
    });

    mlSocket.on("error", (err) => {
        console.error("[ML] WebSocket error:", err.message);
        if (mlSocket) {
            mlSocket.close();
        }
    });
}

function sendToML(message) {
    if (mlSocket && mlSocket.readyState === WebSocket.OPEN) {
        mlSocket.send(JSON.stringify(message));
    } else {
        console.warn("[ML] Not connected — command dropped:", message.type);
    }
}

function scheduleMLReconnect() {
    if (mlReconnectTimer) return;
    mlReconnectTimer = setTimeout(() => {
        mlReconnectTimer = null;
        connectToML();
    }, 3000);
}

// ---------------------------------------------------------------------------
// HTTP Upgrade handler (route /ws to WebSocket)
// ---------------------------------------------------------------------------
server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`[API] GestureCtrl server running on http://localhost:${PORT}`);
    console.log(`[WS]  WebSocket endpoint: ws://localhost:${PORT}/ws`);
    connectToML();
});

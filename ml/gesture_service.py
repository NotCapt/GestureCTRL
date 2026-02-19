"""
GestureCtrl — Python ML Service
Real-time hand gesture recognition + desktop control via WebSocket.
"""

import asyncio
import base64
import functools
import json
import logging
import os
import platform
import pickle
import sys
import time
from collections import deque
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
import mediapipe as mp
import websockets
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
GESTURES_DIR = DATA_DIR / "gestures"
GESTURES_JSON = DATA_DIR / "gestures.json"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "gesture_model.pkl"
META_PATH = MODELS_DIR / "gesture_meta.json"

for d in [GESTURES_DIR, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("GestureCtrl-ML")

# ---------------------------------------------------------------------------
# Action map: action_name -> callable
# ---------------------------------------------------------------------------
ACTION_MAP = {}

def _build_action_map():
    """Build the ACTION_MAP lazily so imports happen only when needed."""
    global ACTION_MAP
    import pyautogui
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.05

    try:
        from pynput.keyboard import Controller as KBController, Key
        kb = KBController()
    except Exception:
        kb = None

    def _hotkey(*keys):
        def _do():
            pyautogui.hotkey(*keys)
        return _do

    ACTION_MAP = {
        # Navigation
        "alt_tab":          _hotkey("alt", "tab"),
        "switch_window":    _hotkey("alt", "tab"),
        "next_tab":         _hotkey("ctrl", "tab"),
        "prev_tab":         _hotkey("ctrl", "shift", "tab"),
        "go_back":          _hotkey("alt", "left"),
        "go_forward":       _hotkey("alt", "right"),
        "close_tab":        _hotkey("ctrl", "w"),
        "new_tab":          _hotkey("ctrl", "t"),
        # Media
        "play_pause":       _hotkey("playpause"),
        "media_next":       _hotkey("nexttrack"),
        "media_prev":       _hotkey("prevtrack"),
        "volume_up":        _hotkey("volumeup"),
        "volume_down":      _hotkey("volumedown"),
        "mute":             _hotkey("volumemute"),
        # System
        "screenshot":       _hotkey("win", "shift", "s"),
        "lock_screen":      _hotkey("win", "l"),
        "show_desktop":     _hotkey("win", "d"),
        "task_view":        _hotkey("win", "tab"),
        "minimize_all":     _hotkey("win", "m"),
        # Scroll
        "scroll_up":        lambda: pyautogui.scroll(5),
        "scroll_down":      lambda: pyautogui.scroll(-5),
        # Misc
        "enter":            _hotkey("enter"),
        "escape":           _hotkey("escape"),
        "undo":             _hotkey("ctrl", "z"),
        "redo":             _hotkey("ctrl", "y"),
        "copy":             _hotkey("ctrl", "c"),
        "paste":            _hotkey("ctrl", "v"),
        "none":             lambda: None,
    }

_build_action_map()

# ---------------------------------------------------------------------------
# Hand Detector (MediaPipe)
# ---------------------------------------------------------------------------
class HandDetector:
    """Wraps MediaPipe Hands — extracts and normalises a 63-D landmark vector."""

    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_draw = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.6,
        )

    def process(self, frame):
        """Return (landmarks_63d | None, annotated_frame)."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        if results.multi_hand_landmarks:
            hand = results.multi_hand_landmarks[0]
            # Draw skeleton on frame
            self.mp_draw.draw_landmarks(
                frame, hand, self.mp_hands.HAND_CONNECTIONS,
                self.mp_draw.DrawingSpec(color=(0, 255, 178), thickness=2, circle_radius=3),
                self.mp_draw.DrawingSpec(color=(0, 200, 150), thickness=2),
            )
            landmarks = self._normalise(hand)
            return landmarks, frame
        return None, frame

    @staticmethod
    def _normalise(hand):
        """Anchor to wrist, scale to [-1, 1] → 63-element float32 array."""
        pts = np.array([[lm.x, lm.y, lm.z] for lm in hand.landmark], dtype=np.float32)
        pts -= pts[0]  # translate wrist to origin
        max_val = np.max(np.abs(pts))
        if max_val > 0:
            pts /= max_val
        return pts.flatten()

    def close(self):
        self.hands.close()

# ---------------------------------------------------------------------------
# Gesture Classifier (KNN)
# ---------------------------------------------------------------------------
class GestureClassifier:
    """K-Nearest Neighbours classifier on 63-D landmark vectors."""

    def __init__(self):
        self.model = None
        self.encoder = None
        self.accuracy = 0.0
        self._load()

    def _load(self):
        if MODEL_PATH.exists():
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                self.model = data["model"]
                self.encoder = data["encoder"]
                self.accuracy = data.get("accuracy", 0.0)
                log.info("Loaded trained model (accuracy %.1f%%)", self.accuracy * 100)
            except Exception as e:
                log.warning("Failed to load model: %s", e)

    def predict(self, vector, threshold=0.55):
        """Return (label, confidence) or (None, 0.0)."""
        if self.model is None or self.encoder is None:
            return None, 0.0
        try:
            # 1. Distance Threshold (outlier detection)
            # Find distance to nearest neighbor
            dist, _ = self.model.kneighbors([vector], n_neighbors=1)
            min_dist = dist[0][0]

            # If the gesture is too far from any known sample, ignore it.
            # 0.7 is a heuristic for 63-dim float32 vectors in [0,1] range.
            # User can tune this via "confidence" slider if we map it,
            # but for now we hardcode a reasonable safety net.
            if min_dist > 0.65:
                # log.debug(f"Ignored outlier: dist={min_dist:.3f}")
                return None, 0.0

            # 2. Probability Check
            proba = self.model.predict_proba([vector])[0]
            max_idx = np.argmax(proba)
            confidence = float(proba[max_idx])
            
            if confidence >= threshold:
                label = self.encoder.inverse_transform([max_idx])[0]
                return label, confidence
        except Exception as e:
            log.debug("Prediction error: %s", e)
        return None, 0.0

    def train(self, gesture_map, progress_callback=None):
        """Train on all .npy samples in data/gestures/{id}/. Returns accuracy."""
        X, y = [], []
        gesture_names = {}

        for gid, info in gesture_map.items():
            gesture_names[gid] = info.get("name", gid)
            sample_dir = GESTURES_DIR / gid
            if not sample_dir.exists():
                continue
            files = list(sample_dir.glob("*.npy"))
            for f in files:
                try:
                    vec = np.load(str(f))
                    if vec.shape == (63,):
                        X.append(vec)
                        y.append(info["name"])
                except Exception:
                    pass

        if len(X) < 2 or len(set(y)) < 1:
            log.warning("Not enough training data")
            if progress_callback:
                progress_callback(100, 0.0, "Not enough data")
            return 0.0

        if progress_callback:
            progress_callback(10, 0.0, "Loading samples...")

        X = np.array(X, dtype=np.float32)
        y = np.array(y)

        encoder = LabelEncoder()
        y_enc = encoder.fit_transform(y)

        if progress_callback:
            progress_callback(30, 0.0, "Encoding labels...")

        # Train/test split
        if len(X) >= 5 and len(set(y)) >= 2:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
            )
        else:
            X_train, X_test, y_train, y_test = X, X, y_enc, y_enc

        k = min(5, len(X_train))
        model = KNeighborsClassifier(n_neighbors=k, weights="distance")

        if progress_callback:
            progress_callback(50, 0.0, "Training KNN...")

        model.fit(X_train, y_train)

        if progress_callback:
            progress_callback(70, 0.0, "Evaluating...")

        accuracy = float(model.score(X_test, y_test))

        # Save
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"model": model, "encoder": encoder, "accuracy": accuracy}, f)

        meta = {gid: info for gid, info in gesture_map.items()}
        with open(META_PATH, "w") as f:
            json.dump(meta, f, indent=2)

        self.model = model
        self.encoder = encoder
        self.accuracy = accuracy

        if progress_callback:
            progress_callback(100, accuracy, "Complete")

        log.info("Training complete — accuracy %.1f%% on %d samples", accuracy * 100, len(X))
        return accuracy

# ---------------------------------------------------------------------------
# Sample Recorder
# ---------------------------------------------------------------------------
class SampleRecorder:
    """Records .npy landmark samples for a specific gesture."""

    def __init__(self):
        self.active = False
        self.gesture_id = None
        self.recorded = 0
        self.total = 80

    def start(self, gesture_id, total=80):
        self.gesture_id = gesture_id
        self.total = total
        self.recorded = 0
        self.active = True
        sample_dir = GESTURES_DIR / gesture_id
        sample_dir.mkdir(parents=True, exist_ok=True)
        log.info("Recording started for gesture '%s' (%d samples)", gesture_id, total)

    def stop(self):
        self.active = False
        log.info("Recording stopped (%d samples saved)", self.recorded)

    def save_sample(self, vector):
        """Save one sample. Returns True if still recording."""
        if not self.active or self.gesture_id is None:
            return False
        sample_dir = GESTURES_DIR / self.gesture_id
        filename = sample_dir / f"sample_{int(time.time()*1000)}_{self.recorded}.npy"
        np.save(str(filename), vector)
        self.recorded += 1
        if self.recorded >= self.total:
            self.active = False
            log.info("Recording complete for '%s' (%d samples)", self.gesture_id, self.recorded)
        return self.active

# ---------------------------------------------------------------------------
# Action Executor (debounce + cooldown)
# ---------------------------------------------------------------------------
class ActionExecutor:
    """Fires desktop actions with debounce buffer and cooldown."""

    def __init__(self, buffer_size=6, cooldown=1.2):
        self.buffer = deque(maxlen=buffer_size)
        self.cooldowns = {}
        self.cooldown_duration = cooldown
        self.enabled = True

    def feed(self, gesture_name, action_name, gesture_map):
        """Feed a detection. Returns the action name if fired, else None."""
        if not self.enabled:
            return None

        self.buffer.append(gesture_name)

        # Check if dominant gesture in buffer
        if len(self.buffer) < 3:
            return None

        from collections import Counter
        counts = Counter(self.buffer)
        dominant, count = counts.most_common(1)[0]
        if dominant != gesture_name or count < (len(self.buffer) * 0.7):
            return None

        # Check cooldown
        now = time.time()
        last_fired = self.cooldowns.get(action_name, 0)
        if now - last_fired < self.cooldown_duration:
            return None

        # Fire action
        action_fn = ACTION_MAP.get(action_name)
        if action_fn:
            try:
                action_fn()
                self.cooldowns[action_name] = now
                log.info("Action fired: %s (gesture: %s)", action_name, gesture_name)
                return action_name
            except Exception as e:
                log.error("Action error: %s", e)
        return None

# ---------------------------------------------------------------------------
# WebSocket Service
# ---------------------------------------------------------------------------
class GestureService:
    """Main service orchestrating camera, ML, and WebSocket communication."""

    def __init__(self):
        self.detector = HandDetector()
        self.classifier = GestureClassifier()
        self.recorder = SampleRecorder()
        self.executor = ActionExecutor()
        self.pool = ThreadPoolExecutor(max_workers=2)

        self.clients = set()
        self.camera = None
        self.camera_on = False
        self.camera_task = None

        self.gestures = self._load_gestures()
        self.confidence_threshold = 0.55
        self.detection_overlay = True

        log.info("GestureCtrl ML Service initialized")

    def _load_gestures(self):
        if GESTURES_JSON.exists():
            try:
                with open(GESTURES_JSON, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_gestures(self):
        with open(GESTURES_JSON, "w") as f:
            json.dump(self.gestures, f, indent=2)

    async def broadcast(self, message):
        """Send JSON message to all connected clients."""
        if not self.clients:
            return
        data = json.dumps(message)
        dead = set()
        for ws in self.clients:
            try:
                await ws.send(data)
            except Exception:
                dead.add(ws)
        self.clients -= dead

    def _read_and_process_frame(self):
        """Blocking work: read camera frame, flip, resize, run MediaPipe.
        Called inside a ThreadPoolExecutor so it doesn't block asyncio."""
        if self.camera is None:
            return None
        ret, frame = self.camera.read()
        if not ret:
            return None
        frame = cv2.flip(frame, 1)
        frame = cv2.resize(frame, (640, 480))
        landmarks, annotated = self.detector.process(frame)
        # Encode to JPEG here too (CPU work)
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, 70]
        _, buf = cv2.imencode(".jpg", annotated, encode_params)
        frame_b64 = base64.b64encode(buf).decode("utf-8")
        return landmarks, frame_b64

    async def camera_loop(self):
        """Main frame capture + detection loop (non-blocking)."""
        log.info("Camera loop started")
        frame_interval = 1.0 / 25  # ~25 fps target
        loop = asyncio.get_event_loop()

        while self.camera_on and self.camera is not None:
            loop_start = time.time()

            # Run blocking camera + MediaPipe work in a thread
            result = await loop.run_in_executor(
                self.pool, self._read_and_process_frame
            )
            if result is None:
                await asyncio.sleep(0.01)
                continue

            landmarks, frame_b64 = result
            detection_info = None

            if landmarks is not None:
                # Recording mode
                if self.recorder.active:
                    still_recording = self.recorder.save_sample(landmarks)
                    recording_msg = {
                        "type": "recording_progress",
                        "id": self.recorder.gesture_id,
                        "recorded": self.recorder.recorded,
                        "total": self.recorder.total,
                        "active": self.recorder.active,
                    }
                    await self.broadcast(recording_msg)

                # Prediction mode (only if not recording)
                else:
                    label, confidence = self.classifier.predict(
                        landmarks, self.confidence_threshold
                    )
                    if label:
                        # Find matching gesture for this label
                        action_name = None
                        gesture_id = None
                        for gid, ginfo in self.gestures.items():
                            if ginfo.get("name") == label and ginfo.get("active", True):
                                action_name = ginfo.get("action", "none")
                                gesture_id = gid
                                break

                        if action_name and action_name != "none":
                            fired = self.executor.feed(label, action_name, self.gestures)
                        else:
                            fired = None

                        detection_info = {
                            "gesture": label,
                            "gestureId": gesture_id,
                            "confidence": round(confidence, 3),
                            "action": action_name,
                            "fired": fired is not None,
                        }

            # Broadcast frame + detection
            msg = {
                "type": "frame",
                "frame": f"data:image/jpeg;base64,{frame_b64}",
            }
            if detection_info:
                msg["detection"] = detection_info

            await self.broadcast(msg)

            # Frame rate control
            elapsed = time.time() - loop_start
            sleep_time = max(0, frame_interval - elapsed)
            await asyncio.sleep(sleep_time)

        log.info("Camera loop stopped")

    async def handle_command(self, ws, message):
        """Process an incoming WebSocket command."""
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            return

        cmd = data.get("type", "")
        log.info("Command received: %s", cmd)

        if cmd == "camera_start":
            # Force close if it thinks it's on but stuck
            if self.camera_on or self.camera is not None:
                await self._close_camera()
            await self._open_camera(ws)

        elif cmd == "camera_stop":
            await self._close_camera()



        elif cmd == "add_gesture":
            gid = data.get("id")
            gesture_data = data.get("data", {})
            if gid:
                self.gestures[gid] = gesture_data
                self._save_gestures()
                await self.broadcast({
                    "type": "gesture_updated",
                    "gestures": self.gestures,
                })

        elif cmd == "delete_gesture":
            gid = data.get("id")
            if gid and gid in self.gestures:
                del self.gestures[gid]
                self._save_gestures()
                # Delete samples
                sample_dir = GESTURES_DIR / gid
                if sample_dir.exists():
                    import shutil
                    shutil.rmtree(sample_dir)
                await self.broadcast({
                    "type": "gesture_updated",
                    "gestures": self.gestures,
                })

        elif cmd == "toggle_gesture":
            gid = data.get("id")
            active = data.get("active", True)
            if gid and gid in self.gestures:
                self.gestures[gid]["active"] = active
                self._save_gestures()
                await self.broadcast({
                    "type": "gesture_updated",
                    "gestures": self.gestures,
                })

        elif cmd == "start_recording":
            gid = data.get("id")
            total = data.get("total", 80)
            if gid:
                # Auto-start camera if not already on
                if not self.camera_on:
                    await self._open_camera(ws)
                self.recorder.start(gid, total)
                await self.broadcast({
                    "type": "recording_started",
                    "id": gid,
                    "total": total,
                })

        elif cmd == "stop_recording":
            self.recorder.stop()
            await self.broadcast({
                "type": "recording_stopped",
                "recorded": self.recorder.recorded,
            })

        elif cmd == "retrain":
            await self.broadcast({"type": "train_progress", "progress": 0, "status": "Starting..."})
            loop = asyncio.get_event_loop()

            def progress_cb(progress, accuracy, status):
                asyncio.run_coroutine_threadsafe(
                    self.broadcast({
                        "type": "train_progress",
                        "progress": progress,
                        "accuracy": round(accuracy * 100, 1),
                        "status": status,
                    }),
                    loop,
                )

            accuracy = await loop.run_in_executor(
                self.pool,
                self.classifier.train,
                self.gestures,
                progress_cb,
            )
            await asyncio.sleep(0.5)  # let last progress message flush
            await self.broadcast({
                "type": "train_complete",
                "accuracy": round(accuracy * 100, 1),
            })

        elif cmd == "get_stats":
            total_samples = 0
            for gid in self.gestures:
                sample_dir = GESTURES_DIR / gid
                if sample_dir.exists():
                    total_samples += len(list(sample_dir.glob("*.npy")))
            await ws.send(json.dumps({
                "type": "stats",
                "accuracy": round(self.classifier.accuracy * 100, 1),
                "totalGestures": len(self.gestures),
                "totalSamples": total_samples,
                "modelLoaded": self.classifier.model is not None,
            }))

        elif cmd == "update_settings":
            if "confidenceThreshold" in data:
                self.confidence_threshold = data["confidenceThreshold"] / 100.0
            if "cooldown" in data:
                self.executor.cooldown_duration = data["cooldown"] / 1000.0
            if "bufferSize" in data:
                old_buf = list(self.executor.buffer)
                self.executor.buffer = deque(old_buf, maxlen=data["bufferSize"])
            await ws.send(json.dumps({"type": "settings_updated", "status": "ok"}))

        elif cmd == "get_gestures":
            await ws.send(json.dumps({
                "type": "gesture_updated",
                "gestures": self.gestures,
            }))

    async def handler(self, ws, path=None):
        """WebSocket connection handler."""
        self.clients.add(ws)
        log.info("Client connected (%d total)", len(self.clients))

        # Send initial state
        await ws.send(json.dumps({
            "type": "connected",
            "gestures": self.gestures,
            "cameraOn": self.camera_on,
            "modelLoaded": self.classifier.model is not None,
            "accuracy": round(self.classifier.accuracy * 100, 1),
        }))

        try:
            async for message in ws:
                await self.handle_command(ws, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.discard(ws)
            log.info("Client disconnected (%d remaining)", len(self.clients))

    async def _open_camera(self, ws=None):
        """Open the camera with platform-appropriate backend."""
        if platform.system() == "Windows":
            self.camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        else:
            self.camera = cv2.VideoCapture(0)
        if self.camera.isOpened():
            self.camera_on = True
            self.camera_task = asyncio.create_task(self.camera_loop())
            await self.broadcast({"type": "camera_status", "active": True})
            log.info("Camera started")
        else:
            msg = {"type": "error", "message": "Could not open camera"}
            if ws:
                await ws.send(json.dumps(msg))
            else:
                await self.broadcast(msg)

    async def _close_camera(self):
        """Close the camera and stop the frame loop."""
        self.camera_on = False
        if self.camera_task:
            try:
                await asyncio.wait_for(self.camera_task, timeout=2.0)
            except asyncio.TimeoutError:
                pass
        if self.camera:
            self.camera.release()
            self.camera = None
        await self.broadcast({"type": "camera_status", "active": False})
        log.info("Camera stopped")

    async def run(self, host="0.0.0.0", port=8765):
        """Start the WebSocket server."""
        log.info("Starting WebSocket server on ws://%s:%d", host, port)
        async with websockets.serve(self.handler, host, port):
            await asyncio.Future()  # run forever

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    service = GestureService()
    try:
        asyncio.run(service.run())
    except KeyboardInterrupt:
        log.info("Shutting down...")
    finally:
        if service.camera:
            service.camera.release()
        service.detector.close()

# gestureCtrl

Turn hand gestures into desktop shortcuts. `gestureCtrl` uses your webcam plus a lightweight ML pipeline (MediaPipe + KNN) to detect custom hand poses and trigger actions like media control, window management, and more.

## ✨ Features

- **Custom gestures**  
  - Add gestures with your own names, icons, and mapped desktop actions  
  - Collect training samples per gesture directly from the app

- **Desktop actions**  
  - Map gestures to common shortcuts: play/pause, volume, next/previous track, scrolling, window control, screenshots, etc.

- **Live monitor**  
  - Real‑time camera feed with gesture overlay  
  - Status cards for ML service, training, camera, and active gesture count

- **Dashboard overview**  
  - “Last Detected” and “Recent Detections” history  
  - Camera and training controls surfaced on the Home tab

- **Settings panel**  
  - Confidence threshold  
  - Action cooldown  
  - Debounce buffer size  
  - Feature toggles like overlay visibility and repeated‑action suppression

- **Light + dark theme** inspired by PayPal’s design language

---

## 🏗 Architecture

The project is split into three main pieces:

- **client** – React + Vite dashboard UI
- **server** – Node.js + Express REST API & WebSocket gateway
- **ml** – Python service (MediaPipe + KNN) that does gesture detection from webcam frames

High‑level flow:

1. Browser sends frames to the ML service via WebSocket.
2. ML service returns detections (gesture id, name, confidence, fired flag, etc.).
3. Node server broadcasts detections to the client.
4. Client updates the dashboard, monitor view, and triggers configured desktop actions via the backend.

---

## 🔧 Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- **Python** ≥ 3.9
- A webcam
- OS where the automation layer (PyAutoGUI or similar) can send keyboard/mouse events

---

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/<your-username>/gesturectrl.git
cd gesturecontrol
```

### 1. Install dependencies

From the project root:

```bash
# Server / root deps (if any)
npm install

# Frontend
cd client
npm install
cd ..

# ML service (inside ml/)
cd ml
pip install -r requirements.txt
cd ..
```

> Adjust the commands if you use `yarn`, `pnpm`, or a different Python env manager (virtualenv, conda, etc.).

### 2. Run the ML service

From the `ml` directory:

```bash
cd ml
python gesture_service.py
```

This will start the Python WebSocket server (default: `ws://localhost:8765` or as configured).

### 3. Run the Node.js API / gateway

From the project root (or `server` folder if you split it):

```bash
npm run server
# or:
# node server/index.js
```

By default this exposes:

- REST API at `http://localhost:3001/api`
- WebSocket at `ws://localhost:3001/ws`

### 4. Run the React dashboard

From the `client` directory:

```bash
cd client
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

---

## 🕹 Using gestureCtrl

1. **Add gestures**
   - Go to the **Gestures** tab.
   - Click **“＋ Add Gesture”**.
   - Give it a name, pick an icon, and select a desktop action.
   - Save the gesture.

2. **Collect samples**
   - On each gesture card, click **“📷 Collect Samples”**.
   - Hold your hand pose steady in front of the camera while samples are collected.

3. **Train the model**
   - From the Gestures tab, click **“🧠 Retrain Model”** (or the **Retrain** pill on the Home tab).
   - Wait for training to complete; you’ll see accuracy and progress.

4. **Start the camera**
   - From **Home** or **Monitor**, click **Start Camera**.
   - In **Live Monitor**, you’ll see the live webcam feed with detected gesture info.
   - The **Last Detected** and **Recent Detections** tiles will update as gestures are recognized.

5. **Fine‑tune settings**
   - Go to **Settings**.
   - Adjust:
     - **Confidence Threshold** – how sure the model must be before firing.
     - **Action Cooldown** – how long to wait before the same action can fire again.
     - **Debounce Buffer Size** – how many consecutive frames confirm a gesture.
   - Toggle overlay visibility and repeated‑action suppression to match your workflow.

---

## ⚙ Configuration

Most runtime configuration is handled via the **Settings** tab in the UI.  
Backend / ML tuning (ports, model hyper‑parameters, etc.) is configured in:

- **Server**: `server/index.js` (ports, REST/WebSocket endpoints)
- **ML service**: `ml/gesture_service.py` (MediaPipe, KNN, thresholds)

Adjust these if you want to:

- Change default ports.
- Swap out the classifier.
- Run the ML service on a different machine.

---

## 🧪 Development

Useful scripts:

```bash
# from client/
npm run dev      # run Vite dev server
npm run build    # production build

# from project root (if configured)
npm run server   # start Node.js backend
```

Recommended workflow:

1. Run ML service.
2. Run Node server.
3. Run `client` dev server.
4. Edit UI in `client/src` and backend logic in `server` / `ml` as needed.

---

## 🛡️ Safety / Failsafe

The automation layer includes a **failsafe** (via PyAutoGUI by default):

- Move your mouse to the **top‑left corner of the screen** to immediately halt automation.

Use this when testing aggressive shortcuts or continuous actions.

---

## 📦 Tech Stack

- **Frontend:** React, Vite, modern CSS (custom theme)
- **Backend:** Node.js, Express, WebSocket
- **ML:** Python, MediaPipe, KNN classifier, WebSocket
- **Automation:** PyAutoGUI (or similar) for desktop control

---

## 📝 License

Add your preferred license here (e.g. MIT).


# GestureCtrl

Control your desktop with hand gestures. No hardware required - just your webcam.

## Features

- **Custom Gestures**: Train your own hand gestures for any action
- **Cursor Control**: Move mouse, click, drag, and scroll with hand movements
- **Real-time Detection**: Fast gesture recognition using MediaPipe
- **System Actions**: Control media playback, switch windows, take screenshots
- **Live Training**: Interactive training with visual feedback
- **Cross-platform**: Works on Windows, macOS, and Linux

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.8+
- Webcam

### Installation

```bash
# Install dependencies
npm install
cd client && npm install && cd ..
pip install -r ml/requirements.txt

# Start all services
npm start
```

Open http://localhost:5173 in your browser.

## Usage

### Training Gestures

1. Go to **Gestures** tab
2. Click **Add Gesture**
3. Choose a name, icon, and action
4. Click **Record** and perform your gesture 500 times
5. Click **Retrain Model**

### Cursor Control

1. Go to **Cursor Control** tab
2. Train gestures for mouse actions (left click, right click, drag, scroll)
3. Enable **Cursor Mode** from the floating widget
4. Control your mouse with hand gestures

## Architecture

```
├── client/          # React frontend (Vite)
├── server/          # Node.js API server
├── ml/              # Python ML service (MediaPipe + KNN)
├── data/            # Training samples
└── models/          # Trained models
```

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express, WebSocket
- **ML**: Python, MediaPipe, scikit-learn
- **Automation**: PyAutoGUI

## Configuration

Edit gesture actions in the UI or modify `data/gestures.json` directly.

Available actions:
- Media control (play/pause, next/prev track, volume)
- Window management (switch windows, close tabs)
- System shortcuts (screenshot, lock screen)
- Custom keyboard shortcuts

## Development

```bash
# Run services separately
python ml/gesture_service.py    # ML service (port 8765)
npm run server                   # API server (port 3001)
cd client && npm run dev         # Frontend (port 5173)
```

## Troubleshooting

**Camera not working?**
- Check browser permissions
- Ensure no other app is using the camera

**Gestures not detected?**
- Retrain the model after adding gestures
- Ensure good lighting
- Keep hand clearly visible

**Model accuracy low?**
- Record more varied samples during training
- Move hand to different positions/angles
- Increase training samples

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.

Repository: https://github.com/NotCapt/GestureCTRL.git

## License

MIT

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.

---

Built with ❤️ for hands-free computing

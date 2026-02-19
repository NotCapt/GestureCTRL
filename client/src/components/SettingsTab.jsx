import React, { useState } from 'react';

export default function SettingsTab({ updateSettings, addToast }) {
    const [confidence, setConfidence] = useState(55);
    const [cooldown, setCooldown] = useState(1200);
    const [bufferSize, setBufferSize] = useState(6);
    const [autoRetrain, setAutoRetrain] = useState(false);
    const [detectionOverlay, setDetectionOverlay] = useState(true);
    const [suppressRepeated, setSuppressRepeated] = useState(true);

    const handleConfidence = (val) => {
        setConfidence(val);
        updateSettings({ confidenceThreshold: val });
    };

    const handleCooldown = (val) => {
        setCooldown(val);
        updateSettings({ cooldown: val });
    };

    const handleBuffer = (val) => {
        setBufferSize(val);
        updateSettings({ bufferSize: val });
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Settings</h1>
                    <p className="section-desc">Configure detection parameters and system behavior</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* Detection Settings */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">🎯 Detection Settings</span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Confidence Threshold</div>
                            <div className="setting-desc">Minimum prediction confidence to trigger a gesture</div>
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="10"
                                max="95"
                                value={confidence}
                                onChange={(e) => handleConfidence(Number(e.target.value))}
                            />
                            <span className="slider-value">{confidence}%</span>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Action Cooldown</div>
                            <div className="setting-desc">Delay before the same action can fire again</div>
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="300"
                                max="3000"
                                step="100"
                                value={cooldown}
                                onChange={(e) => handleCooldown(Number(e.target.value))}
                            />
                            <span className="slider-value">{(cooldown / 1000).toFixed(1)}s</span>
                        </div>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Debounce Buffer Size</div>
                            <div className="setting-desc">Number of consecutive frames needed to confirm gesture</div>
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="2"
                                max="12"
                                value={bufferSize}
                                onChange={(e) => handleBuffer(Number(e.target.value))}
                            />
                            <span className="slider-value">{bufferSize}</span>
                        </div>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">⚡ Feature Toggles</span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Auto-Retrain</div>
                            <div className="setting-desc">Automatically retrain when samples are collected</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={autoRetrain} onChange={(e) => setAutoRetrain(e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Detection Overlay</div>
                            <div className="setting-desc">Show gesture detection info on the video feed</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={detectionOverlay} onChange={(e) => setDetectionOverlay(e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">Suppress Repeated Actions</div>
                            <div className="setting-desc">Prevent the same action from firing while gesture is held</div>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={suppressRepeated} onChange={(e) => setSuppressRepeated(e.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>

                {/* System Info */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">🔧 System Info</span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">API Server</div>
                            <div className="setting-desc">Node.js Express REST API</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            localhost:3001
                        </span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">ML Service</div>
                            <div className="setting-desc">Python WebSocket (MediaPipe + KNN)</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            localhost:8765
                        </span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">WebSocket</div>
                            <div className="setting-desc">Real-time communication channel</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            ws://localhost:3001/ws
                        </span>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="setting-label">PyAutoGUI Failsafe</div>
                            <div className="setting-desc">Move mouse to top-left corner to halt automation</div>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                            ✅ Enabled
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

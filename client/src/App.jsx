import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './LandingPage';
import { useBackend } from './hooks/useBackend';
import GesturesTab from './components/GesturesTab';
import MonitorTab from './components/MonitorTab';
import SettingsTab from './components/SettingsTab';
import Toast from './components/Toast';
import { ACTIONS } from './components/AddGestureModal';
import './App.css';

let toastIdCounter = 0;

export default function App() {
    const [showLanding, setShowLanding] = useState(true);
    const [activeTab, setActiveTab] = useState('Home');
    const [toasts, setToasts] = useState([]);

    // Dark Mode State
    const [darkMode, setDarkMode] = useState(false);

    // Apply dark mode class to body/root
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    const backend = useBackend();
    const {
        gestures, detected, trainState, cameraOn,
        startCamera, stopCamera, trainModel, mlConnected
    } = backend;

    const addToast = useCallback((type, message, duration = 3500) => {
        const id = ++toastIdCounter;
        setToasts((prev) => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (showLanding) {
        return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }

    // Dashboard Helper Data
    const gestureCount = Object.keys(gestures).length;
    const actionLabels = Object.fromEntries(ACTIONS.map(a => [a.value, a.label]));
    const formatTimeAgo = (ts) => {
        if (!ts) return '-';
        const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (s < 10) return 'Just now';
        if (s < 60) return `${s}s ago`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        return `${d}d ago`;
    };

    const lastDetected = backend.lastDetected;
    const lastGesture = lastDetected ? lastDetected.name : 'None';
    const lastConfidence = lastDetected ? Math.round(lastDetected.confidence * 100) : 0;
    const lastAction = lastDetected ? (actionLabels[lastDetected.action] || 'No action') : 'No action';

    const recentDetections = (backend.recentDetections?.length > 0)
        ? backend.recentDetections.map((d) => ({
            name: d.name,
            time: formatTimeAgo(d.ts),
            icon: d.icon || '✋',
        }))
        : [{ name: 'No recent gestures', time: '-', icon: '—' }];

    return (
        <div className={`app-container ${darkMode ? 'dark' : ''}`}>
            {/* Top Navigation Bar */}
            <nav className="navbar">
                <div className="nav-left">
                    <div className="nav-logo">
                        <span>✋</span> gestureCtrl
                    </div>
                    <div className="nav-links">
                        {['Home', 'Gestures', 'Monitor', 'Settings', 'Help'].map(tab => (
                            <div
                                key={tab}
                                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="nav-right">
                    {/* Dark Mode Toggle */}
                    <div className="nav-icon" onClick={() => setDarkMode(!darkMode)} title="Toggle Dark Mode">
                        {darkMode ? '☀️' : '🌙'}
                    </div>

                    <div className="nav-icon" onClick={() => setActiveTab('Settings')}>⚙️</div>
                    <div className="nav-logout" onClick={() => setShowLanding(true)}>LOG OUT</div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="main-wrapper">
                {activeTab === 'Home' && (
                    <div className="dashboard-container">
                        {/* Left Column (Main Feed) */}
                        <div className="main-feed card-stack">
                            <div className="d-card card-model-status">
                                <div>
                                    <div className="card-label">Model Accuracy</div>
                                    <div className="metric-large">{trainState.accuracy > 0 ? `${trainState.accuracy}%` : '--%'}</div>
                                    <div className="metric-sub">
                                        Status: {trainState.status === 'idle' ? 'Ready' : trainState.status}
                                    </div>
                                    <div className="card-link" onClick={trainModel}>
                                        {trainState.status === 'training' ? 'Training...' : 'Retrain Now'} ➔
                                    </div>
                                </div>
                                <div style={{ fontSize: '40px', opacity: 0.2 }}>🧠</div>
                            </div>

                            <div className="d-card card-detected">
                                <div>
                                    <div className="card-label">Last Detected</div>
                                    <div className="gesture-display-large">{lastGesture}</div>
                                    <div className="gesture-meta">
                                        Confidence: {lastConfidence}% · Action: {lastAction}
                                    </div>
                                    <button className="pill-btn" onClick={() => setActiveTab('Monitor')}>
                                        View in Monitor
                                    </button>
                                </div>
                                <div className="gesture-visual">
                                    {lastDetected?.icon || '✋'}
                                </div>
                            </div>

                            <div className="d-card card-setup">
                                <div className="setup-progress-circle">
                                    {gestureCount}/6
                                </div>
                                <div>
                                    <div className="list-name">Complete your gesture setup</div>
                                    <div className="list-desc">Add more gestures to improve control accuracy</div>
                                </div>
                            </div>

                            <div className="d-card card-promo">
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                                        Your gestures are ready
                                    </div>
                                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                                        Camera is {cameraOn ? 'active' : 'inactive'}
                                    </div>
                                </div>
                                <button className="promo-btn" onClick={cameraOn ? stopCamera : startCamera}>
                                    {cameraOn ? 'Stop Camera' : 'Open Camera'}
                                </button>
                            </div>
                        </div>

                        {/* Right Column (Sidebar) */}
                        <div className="sidebar">
                            <div className="action-buttons">
                                <button className="action-pill" onClick={cameraOn ? stopCamera : startCamera}>
                                    {cameraOn ? 'Stop Camera' : 'Start Camera'}
                                </button>
                                <button className="action-pill" onClick={trainModel}>
                                    Retrain
                                </button>
                            </div>

                            <div className="d-card" style={{ marginBottom: '24px' }}>
                                <div className="icon-grid">
                                    <div className="icon-item" onClick={() => setActiveTab('Gestures')}>
                                        <div className="icon-circle">＋</div>
                                        <span className="icon-label">Add</span>
                                    </div>
                                    <div className="icon-item" onClick={() => setActiveTab('Gestures')}>
                                        <div className="icon-circle">🗑️</div>
                                        <span className="icon-label">Delete</span>
                                    </div>
                                    <div className="icon-item" onClick={() => setActiveTab('Monitor')}>
                                        <div className="icon-circle">📹</div>
                                        <span className="icon-label">Monitor</span>
                                    </div>
                                    <div className="icon-item" onClick={() => setActiveTab('Settings')}>
                                        <div className="icon-circle">⚙️</div>
                                        <span className="icon-label">Settings</span>
                                    </div>
                                    <div className="icon-item">
                                        <div className="icon-circle">⋯</div>
                                        <span className="icon-label">More</span>
                                    </div>
                                </div>
                            </div>

                            <div className="list-section">
                                <div className="list-header">
                                    <div className="list-title">Recent Detections</div>
                                    <div className="list-more">⋮</div>
                                </div>
                                <div className="d-card" style={{ padding: '0 20px' }}>
                                    {recentDetections.map((item, i) => (
                                        <div key={i} className="list-item" style={i === recentDetections.length - 1 ? { borderBottom: 'none' } : {}}>
                                            <div className="list-avatar">{item.icon}</div>
                                            <div className="list-content">
                                                <div className="list-name">{item.name}</div>
                                                <div className="list-desc">{item.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="list-section">
                                <div className="list-title" style={{ marginBottom: '12px' }}>Connected Devices</div>
                                <div className="d-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '24px' }}>📷</div>
                                    <div>
                                        <div className="list-name">Built-in Camera</div>
                                        <div className="list-desc" style={{ color: cameraOn ? 'var(--teal-accent)' : 'inherit' }}>
                                            {cameraOn ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="card-link" style={{ marginLeft: 'auto', fontSize: '12px' }}>Manage</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legacy Tabs Wrapped in New Layout Card */}
                {activeTab === 'Gestures' && (
                    <div className="d-card" style={{ minHeight: '600px' }}>
                        <GesturesTab
                            gestures={backend.gestures}
                            detected={backend.detected}
                            recording={backend.recording}
                            trainState={backend.trainState}
                            addGesture={backend.addGesture}
                            deleteGesture={backend.deleteGesture}
                            toggleGesture={backend.toggleGesture}
                            startRecording={backend.startRecording}
                            trainModel={backend.trainModel}
                            addToast={addToast}
                            liveFrame={backend.liveFrame}
                        />
                    </div>
                )}

                {activeTab === 'Monitor' && (
                    <div className="d-card" style={{ minHeight: '600px' }}>
                        <MonitorTab
                            liveFrame={backend.liveFrame}
                            detected={backend.detected}
                            cameraOn={backend.cameraOn}
                            mlConnected={backend.mlConnected}
                            startCamera={backend.startCamera}
                            stopCamera={backend.stopCamera}
                            trainState={backend.trainState}
                            gestures={backend.gestures}
                            addToast={addToast}
                        />
                    </div>
                )}

                {activeTab === 'Settings' && (
                    <div className="page-wrapper">
                        {/* Settings already has internal cards, so we don't wrap it in one big card to allow grid layout */}
                        <SettingsTab
                            updateSettings={backend.updateSettings}
                            addToast={addToast}
                        />
                    </div>
                )}

                {activeTab === 'Help' && (
                    <div className="d-card" style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📘</div>
                        <h2>Documentation</h2>
                        <p style={{ marginTop: '10px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '10px auto' }}>
                            Learn how to train custom gestures and map them to keyboard shortcuts.
                        </p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }}>View Docs</button>
                    </div>
                )}
            </div>

            <Toast toasts={toasts} removeToast={removeToast} />
        </div>
    );
}

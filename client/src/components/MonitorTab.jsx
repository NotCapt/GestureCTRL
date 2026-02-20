import React from 'react';
import SystemStatusIndicator from './SystemStatusIndicator';

export default function MonitorTab({
    liveFrame, detected, cameraOn, mlConnected,
    startCamera, stopCamera, trainState, gestures, addToast, systemState
}) {
    const gestureCount = Object.keys(gestures).length;
    const activeGestures = Object.values(gestures).filter(g => g.active !== false).length;

    const handleCameraToggle = async () => {
        try {
            if (cameraOn) {
                await stopCamera();
                addToast('info', 'Camera stopped');
            } else {
                await startCamera();
                addToast('success', 'Camera started');
            }
        } catch (e) {
            addToast('error', 'Failed to toggle camera');
        }
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Live Monitor</h1>
                    <p className="section-desc">Real-time camera feed with gesture detection overlay</p>
                </div>
                <button
                    className={`btn ${cameraOn ? 'btn-secondary' : 'btn-primary'} camera-toggle`}
                    onClick={handleCameraToggle}
                >
                    {cameraOn ? '⏹ Stop Camera' : '▶ Start Camera'}
                </button>
            </div>

            {/* System Status */}
            <div style={{ marginBottom: '20px' }}>
                <SystemStatusIndicator systemState={systemState || 'PAUSED'} />
            </div>

            <div className="monitor-layout" style={{ marginTop: 20 }}>
                {/* Video feed */}
                <div className="video-container">
                    {cameraOn && liveFrame ? (
                        <>
                            <img className="video-feed" src={liveFrame} alt="Live camera feed" />
                            {detected && (
                                <div className="detection-pill">
                                    <span className="detection-pill-main">
                                        {detected.gesture} · {Math.round(detected.confidence * 100)}%
                                    </span>
                                    {detected.action && detected.action !== 'none' && (
                                        <span className="detection-pill-action">
                                            {detected.fired ? '⚡' : '🔒'} {detected.action.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="video-placeholder">
                            <div className="video-placeholder-icon">📹</div>
                            <div className="video-placeholder-text">
                                {!mlConnected
                                    ? 'ML service is offline — start the Python service'
                                    : 'Click "Start Camera" to begin'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats sidebar */}
                <div className="stat-cards">
                    <div className="stat-card">
                        <div className="stat-label">Active Gestures</div>
                        <div className="stat-value accent">{activeGestures}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Total Gestures</div>
                        <div className="stat-value">{gestureCount}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Model Accuracy</div>
                        <div className={`stat-value ${trainState.accuracy >= 80 ? 'accent' : trainState.accuracy >= 50 ? 'warning' : 'danger'}`}>
                            {trainState.accuracy > 0 ? `${trainState.accuracy}%` : '—'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">ML Service</div>
                        <div className={`stat-value ${mlConnected ? 'accent' : 'danger'}`}
                            style={{ fontSize: 20 }}>
                            {mlConnected ? '🟢 Online' : '🔴 Offline'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Training Status</div>
                        <div className={`stat-value ${trainState.status === 'training' ? 'warning' : ''}`}
                            style={{ fontSize: 18 }}>
                            {trainState.status === 'training' ? `⏳ ${trainState.progress}%`
                                : trainState.status === 'complete' ? '✅ Complete'
                                    : '⚪ Idle'}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Camera</div>
                        <div className={`stat-value ${cameraOn ? 'accent' : ''}`}
                            style={{ fontSize: 20 }}>
                            {cameraOn ? '📹 Active' : '⬛ Off'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

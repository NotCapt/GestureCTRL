import React, { useState, useEffect } from 'react';

const TRAINING_PROMPTS = [
    { text: 'Hold gesture in center', icon: '🎯' },
    { text: 'Move hand left', icon: '👈' },
    { text: 'Move hand right', icon: '👉' },
    { text: 'Move hand up', icon: '👆' },
    { text: 'Move hand down', icon: '👇' },
    { text: 'Rotate hand slightly', icon: '🔄' },
    { text: 'Move closer to camera', icon: '🔍' },
    { text: 'Move farther from camera', icon: '🔎' },
];

export default function TrainingOverlay({ 
    liveFrame, 
    recording, 
    gestureName,
    gestureIcon,
    onStop 
}) {
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

    useEffect(() => {
        if (!recording?.active) return;

        const interval = setInterval(() => {
            setCurrentPromptIndex((prev) => (prev + 1) % TRAINING_PROMPTS.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [recording?.active]);

    if (!recording?.active) return null;

    const progress = recording.recorded / recording.total;
    const currentPrompt = TRAINING_PROMPTS[currentPromptIndex];
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="training-overlay">
            <div className="training-overlay-content">
                {/* Camera Feed */}
                <div className="training-video-container">
                    {liveFrame ? (
                        <img 
                            className="training-video-feed" 
                            src={liveFrame} 
                            alt="Training camera feed" 
                        />
                    ) : (
                        <div className="training-video-placeholder">
                            <div className="training-placeholder-icon">📹</div>
                            <div>Waiting for camera...</div>
                        </div>
                    )}

                    {/* Hand Outline Overlay */}
                    <div className="training-hand-outline">
                        <svg viewBox="0 0 200 200" className="hand-outline-svg">
                            <circle 
                                cx="100" 
                                cy="100" 
                                r="60" 
                                fill="none" 
                                stroke="rgba(0, 255, 178, 0.3)" 
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            <text 
                                x="100" 
                                y="110" 
                                textAnchor="middle" 
                                fill="rgba(255, 255, 255, 0.8)" 
                                fontSize="48"
                            >
                                {gestureIcon || '✋'}
                            </text>
                        </svg>
                    </div>

                    {/* Instruction Prompt */}
                    <div className="training-instruction">
                        <div className="training-instruction-icon">{currentPrompt.icon}</div>
                        <div className="training-instruction-text">{currentPrompt.text}</div>
                    </div>

                    {/* Progress Ring */}
                    <div className="training-progress-ring">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.1)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="#00FFB2"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                            />
                        </svg>
                        <div className="training-progress-text">
                            <div className="training-progress-count">
                                {recording.recorded}/{recording.total}
                            </div>
                            <div className="training-progress-label">samples</div>
                            <div className="training-progress-percent">
                                {Math.round(progress * 100)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="training-info-panel">
                    <div className="training-info-header">
                        <div className="training-gesture-display">
                            <div className="training-gesture-icon-large">{gestureIcon || '✋'}</div>
                            <div>
                                <div className="training-gesture-name">{gestureName}</div>
                                <div className="training-gesture-subtitle">Training in Progress</div>
                            </div>
                        </div>
                    </div>

                    <div className="training-tips">
                        <div className="training-tips-title">💡 Training Tips</div>
                        <ul className="training-tips-list">
                            <li>Follow the on-screen prompts to vary hand position</li>
                            <li>Keep your gesture consistent and clear</li>
                            <li>Ensure good lighting for best results</li>
                            <li>Training will complete automatically</li>
                        </ul>
                    </div>

                    <div className="training-actions">
                        <button 
                            className="btn btn-danger training-stop-btn"
                            onClick={onStop}
                        >
                            ⏹ Stop Training
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

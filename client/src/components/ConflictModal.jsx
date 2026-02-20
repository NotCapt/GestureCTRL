import React, { useState } from 'react';

export default function ConflictModal({ conflicts, onResolve, onClose }) {
    const [rememberChoice, setRememberChoice] = useState(false);

    if (!conflicts || conflicts.length < 2) return null;

    const handleChoice = (gesture) => {
        onResolve(gesture, rememberChoice);
    };

    return (
        <div className="modal-overlay conflict-modal-overlay">
            <div className="modal conflict-modal">
                <div className="conflict-header">
                    <div className="conflict-icon">⚠️</div>
                    <div>
                        <div className="modal-title">Gesture Conflict Detected</div>
                        <div className="modal-desc">
                            Multiple gestures were detected with similar confidence. Please choose which action to perform.
                        </div>
                    </div>
                </div>

                <div className="conflict-options">
                    {conflicts.map((item, idx) => (
                        <button
                            key={idx}
                            className="conflict-option"
                            onClick={() => handleChoice(item)}
                        >
                            <div className="conflict-option-icon">{item.icon || '✋'}</div>
                            <div className="conflict-option-content">
                                <div className="conflict-option-name">{item.gesture}</div>
                                <div className="conflict-option-action">
                                    Action: {item.action?.replace(/_/g, ' ') || 'None'}
                                </div>
                                <div className="conflict-option-confidence">
                                    Confidence: {Math.round(item.confidence * 100)}%
                                </div>
                            </div>
                            <div className="conflict-option-arrow">→</div>
                        </button>
                    ))}
                </div>

                <div className="conflict-remember">
                    <label className="conflict-checkbox-label">
                        <input
                            type="checkbox"
                            checked={rememberChoice}
                            onChange={(e) => setRememberChoice(e.target.checked)}
                        />
                        <span>Always choose this gesture when these conflict</span>
                    </label>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel (No Action)
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';

const CURSOR_ACTIONS = [
    { id: 'left_click', name: 'Left Click', icon: '??', desc: 'Primary mouse button' },
    { id: 'right_click', name: 'Right Click', icon: '???', desc: 'Context menu' },
    { id: 'drag', name: 'Drag & Drop', icon: '?', desc: 'Click and hold to drag' },
    { id: 'scroll', name: 'Scroll', icon: '??', desc: 'Scroll pages up/down' },
    { id: 'click_select', name: 'Click-to-Select', icon: '??', desc: 'Point and click anywhere' },
];

export default function CursorSettings({ onClose, onTrain, recording, liveFrame, gestures, embedded = false }) {
    const handleTrain = (actionId) => {
        if (onTrain) {
            onTrain(actionId);
        }
    };

    const getCursorGesture = (cursorAction) => {
        if (!gestures) return null;
        const entry = Object.entries(gestures).find(
            ([_, g]) => g.cursorAction === cursorAction && g.action === 'cursor_action'
        );
        return entry ? { id: entry[0], ...entry[1] } : null;
    };

    const isTraining = recording?.active && recording?.id;
    const trainingGesture = isTraining && gestures ? gestures[recording.id] : null;

    const content = (
        <>
            {isTraining && liveFrame && trainingGesture && (
                <div className="cursor-training-preview">
                    <div className="training-preview-header">
                        <div className="training-preview-title">
                            ?? Recording: {trainingGesture.name}
                        </div>
                        <div className="training-preview-progress">
                            {recording.recorded} / {recording.total} samples
                        </div>
                    </div>
                    <img src={liveFrame} alt="Training preview" className="training-preview-image" />
                    <div className="training-preview-bar">
                        <div className="training-preview-bar-fill" style={{ width: `${(recording.recorded / recording.total) * 100}%` }} />
                    </div>
                </div>
            )}

            <div className="cursor-action-grid">
                {CURSOR_ACTIONS.map((action) => {
                    const mappedGesture = getCursorGesture(action.id);
                    const isTrained = !!mappedGesture;
                    
                    return (
                        <div key={action.id} className="cursor-action-card">
                            <div className="cursor-action-icon">{action.icon}</div>
                            <div className="cursor-action-info">
                                <div className="cursor-action-name">{action.name}</div>
                                <div className="cursor-action-desc">{action.desc}</div>
                            </div>
                            
                            {isTrained ? (
                                <div className="cursor-action-status">
                                    <div className="cursor-trained-badge"> Trained</div>
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleTrain(action.id)} disabled={isTraining}>
                                         Retrain
                                    </button>
                                </div>
                            ) : (
                                <button className="btn btn-sm btn-primary" onClick={() => handleTrain(action.id)} disabled={isTraining}>
                                     Train Gesture
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal cursor-settings-modal-v2" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title"> Cursor Mode Gestures</div>
                        <div className="modal-desc">Train custom gestures for cursor control actions</div>
                    </div>
                    <button className="modal-close" onClick={onClose} type="button" aria-label="Close"></button>
                </div>
                {content}
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose} disabled={isTraining}>
                        {isTraining ? 'Training...' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
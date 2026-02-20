import React, { useState } from 'react';
import AddGestureModal, { ACTIONS } from './AddGestureModal';
import ConfirmDialog from './ConfirmDialog';

export default function GesturesTab({
    gestures, detected, recording, trainState,
    addGesture, deleteGesture, toggleGesture, updateGesture,
    startRecording, trainModel, addToast, liveFrame
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [editingGesture, setEditingGesture] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const gestureEntries = Object.entries(gestures);
    const actionLabels = Object.fromEntries(ACTIONS.map(a => [a.value, a.label]));

    const handleAdd = async (name, icon, action) => {
        try {
            if (editingGesture) {
                await updateGesture(editingGesture.id, name, icon, action);
                setEditingGesture(null);
                addToast('success', `Gesture "${name}" updated successfully`);
            } else {
                await addGesture(name, icon, action);
                setShowAdd(false);
                addToast('success', `Gesture "${name}" added successfully`);
            }
        } catch (e) {
            addToast('error', editingGesture ? 'Failed to update gesture' : 'Failed to add gesture');
        }
    };

    const handleEdit = (id) => {
        setEditingGesture({ id, ...gestures[id] });
    };

    const handleDelete = async (id) => {
        try {
            await deleteGesture(id);
            setConfirmDelete(null);
            addToast('success', 'Gesture deleted');
        } catch (e) {
            addToast('error', 'Failed to delete gesture');
        }
    };

    const handleToggle = async (id, active) => {
        try {
            await toggleGesture(id, active);
        } catch (e) {
            addToast('error', 'Failed to toggle gesture');
        }
    };

    const handleRecord = async (id) => {
        try {
            await startRecording(id, 500);  // Increased from 80 to 500
            addToast('info', 'Recording started — hold your gesture steady');
        } catch (e) {
            addToast('error', 'Failed to start recording');
        }
    };

    const handleTrain = async () => {
        try {
            await trainModel();
            addToast('info', 'Model retraining started...');
        } catch (e) {
            addToast('error', 'Failed to start training');
        }
    };

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Gestures</h1>
                    <p className="section-desc">
                        {gestureEntries.length} gesture{gestureEntries.length !== 1 ? 's' : ''} configured
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={handleTrain}
                        disabled={trainState.status === 'training' || gestureEntries.length === 0}>
                        🧠 Retrain Model
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                        ＋ Add Gesture
                    </button>
                </div>
            </div>

            {/* Training progress */}
            {trainState.status === 'training' && (
                <div className="train-bar-container">
                    <div className="train-status">
                        <span className="train-label">🧠 {trainState.statusText || 'Training...'}</span>
                        <span className="train-pct">{trainState.progress}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill warning" style={{ width: `${trainState.progress}%` }} />
                    </div>
                </div>
            )}

            {trainState.status === 'complete' && (
                <div className="train-bar-container" style={{ borderColor: 'rgba(0, 255, 178, 0.3)' }}>
                    <div className="train-status">
                        <span className="train-label">✅ Training Complete</span>
                        <span className="train-pct">{trainState.accuracy}% accuracy</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '100%' }} />
                    </div>
                </div>
            )}

            {/* Gesture cards */}
            {gestureEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🤚</div>
                    <div className="empty-title">No Gestures Yet</div>
                    <div className="empty-desc">
                        Click "Add Gesture" to define your first hand gesture and map it to a desktop action.
                    </div>
                </div>
            ) : (
                <div className="gestures-grid">
                    {gestureEntries.map(([id, g]) => {
                        const isDetected = detected?.gestureId === id;
                        const isRecording = recording?.id === id && recording?.active;
                        const recordProgress = isRecording ? (recording.recorded / recording.total) * 100 : 0;

                        return (
                            <div key={id} className={`gesture-card ${isDetected ? 'detected' : ''}`}>
                                <div className="gesture-card-top">
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div className="gesture-icon">{g.icon || '✋'}</div>
                                        <div>
                                            <div className="gesture-name">{g.name}</div>
                                            <div className="gesture-action">{actionLabels[g.action] || g.action}</div>
                                        </div>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={g.active !== false}
                                            onChange={(e) => handleToggle(id, e.target.checked)}
                                        />
                                        <span className="toggle-slider" />
                                    </label>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span className={`samples-badge ${g.samples > 0 ? 'has-samples' : ''}`}>
                                        {g.samples || 0} samples
                                    </span>
                                    {isDetected && (
                                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                                            🎯 Detected ({Math.round(detected.confidence * 100)}%)
                                        </span>
                                    )}
                                </div>

                                {/* Recording progress */}
                                {isRecording && (
                                    <div>
                                        <div className="progress-bar">
                                            <div className="progress-fill warning" style={{ width: `${recordProgress}%` }} />
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 6, textAlign: 'center' }}>
                                            Recording: {recording.recorded}/{recording.total} samples
                                        </div>
                                    </div>
                                )}

                                <div className="gesture-card-actions">
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleEdit(id)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleRecord(id)}
                                        disabled={isRecording || (recording?.active && recording?.id !== id)}
                                    >
                                        {isRecording ? '⏺ Recording...' : '📷 Collect Samples'}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => setConfirmDelete(id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {(showAdd || editingGesture) && (
                <AddGestureModal 
                    onAdd={handleAdd} 
                    onClose={() => {
                        setShowAdd(false);
                        setEditingGesture(null);
                    }}
                    editMode={!!editingGesture}
                    existingGesture={editingGesture}
                />
            )}

            {confirmDelete && gestures[confirmDelete] && (
                <ConfirmDialog
                    title="Delete Gesture"
                    message={`Are you sure you want to delete "${gestures[confirmDelete].name}"?`}
                    warning="This will permanently delete all collected samples for this gesture. This action cannot be undone."
                    confirmLabel="Delete Gesture"
                    danger
                    onConfirm={() => handleDelete(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}

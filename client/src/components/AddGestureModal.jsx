import React, { useState } from 'react';

const ICONS = ['✋', '👆', '👇', '👈', '👉', '✌️', '🤞', '🤟', '🤘', '👍', '👎', '👊', '✊', '🤜', '🖐️', '🖖', '☝️', '🫰', '🫵', '🫱', '🫲', '🤙', '👋', '🫳'];

const ACTIONS = [
    { value: 'alt_tab', label: 'Switch Window (Alt+Tab)' },
    { value: 'next_tab', label: 'Next Tab' },
    { value: 'prev_tab', label: 'Previous Tab' },
    { value: 'go_back', label: 'Go Back' },
    { value: 'go_forward', label: 'Go Forward' },
    { value: 'close_tab', label: 'Close Tab' },
    { value: 'new_tab', label: 'New Tab' },
    { value: 'play_pause', label: 'Play / Pause Media' },
    { value: 'media_next', label: 'Next Track' },
    { value: 'media_prev', label: 'Previous Track' },
    { value: 'volume_up', label: 'Volume Up' },
    { value: 'volume_down', label: 'Volume Down' },
    { value: 'mute', label: 'Mute' },
    { value: 'screenshot', label: 'Screenshot (Win+Shift+S)' },
    { value: 'lock_screen', label: 'Lock Screen' },
    { value: 'show_desktop', label: 'Show Desktop' },
    { value: 'task_view', label: 'Task View' },
    { value: 'minimize_all', label: 'Minimize All' },
    { value: 'scroll_up', label: 'Scroll Up' },
    { value: 'scroll_down', label: 'Scroll Down' },
    { value: 'enter', label: 'Enter' },
    { value: 'escape', label: 'Escape' },
    { value: 'undo', label: 'Undo' },
    { value: 'redo', label: 'Redo' },
    { value: 'copy', label: 'Copy' },
    { value: 'paste', label: 'Paste' },
    { value: 'none', label: 'No Action' },
];

export default function AddGestureModal({ onAdd, onClose, editMode, existingGesture }) {
    const [name, setName] = useState(editMode ? existingGesture?.name || '' : '');
    const [icon, setIcon] = useState(editMode ? existingGesture?.icon || '✋' : '✋');
    const [action, setAction] = useState(editMode ? existingGesture?.action || 'play_pause' : 'play_pause');

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAdd(name.trim(), icon, action);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="modal-title">{editMode ? 'Edit Gesture' : 'Add New Gesture'}</div>
                        <div className="modal-desc">
                            {editMode ? 'Update the gesture name, icon, or action.' : 'Define a hand gesture and map it to a desktop action.'}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} type="button" aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Gesture Name</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. Thumbs Up, Peace Sign..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Desktop Action</label>
                        <select
                            className="form-select"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                        >
                            {ACTIONS.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <div className="form-label-row">
                            <label className="form-label">Icon</label>
                            <div className="icon-selected" aria-label={`Selected icon ${icon}`}>{icon}</div>
                        </div>
                        <div className="icon-picker" role="listbox" aria-label="Pick an icon">
                            {ICONS.map((ic) => (
                                <button
                                    key={ic}
                                    className={`icon-option ${icon === ic ? 'selected' : ''}`}
                                    onClick={() => setIcon(ic)}
                                    type="button"
                                    aria-label={`Icon ${ic}`}
                                    aria-selected={icon === ic}
                                    title={ic}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={!name.trim()}>
                        {editMode ? '💾 Update Gesture' : '✨ Add Gesture'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export { ACTIONS };

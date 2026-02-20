import React from 'react';

export default function ConfirmDialog({ title, message, warning, onConfirm, onCancel, confirmLabel, danger }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-title">{title || 'Confirm Action'}</div>
                <div className="modal-desc">{message}</div>

                {warning && (
                    <div className="confirm-warning">
                        <span className="confirm-warning-icon">⚠️</span>
                        <span className="confirm-warning-text">{warning}</span>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmLabel || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

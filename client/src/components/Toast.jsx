import React, { useState, useEffect } from 'react';

export default function Toast({ toasts, removeToast }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDone={() => removeToast(t.id)} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDone }) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLeaving(true);
            setTimeout(onDone, 300);
        }, toast.duration || 3000);
        return () => clearTimeout(timer);
    }, [toast, onDone]);

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <div className={`toast ${toast.type || 'info'} ${leaving ? 'leaving' : ''}`}>
            <span className="toast-icon">{icons[toast.type] || icons.info}</span>
            <span>{toast.message}</span>
        </div>
    );
}

import React, { useState } from 'react';

export default function FloatingWidget({ 
    systemState, 
    onTogglePause, 
    onOpenDashboard,
    lastDetected,
    cameraOn,
    cursorMode,
    onToggleCursorMode,
    onOpenCursorSettings
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 220, y: 80 });

    const handleMouseDown = (e) => {
        if (e.target.closest('.widget-action')) return;
        setIsDragging(true);
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;

        const handleMouseMove = (e) => {
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - startX)),
                y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - startY))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const getStateColor = () => {
        switch (systemState) {
            case 'ACTIVE': return '#00A8A8';
            case 'PAUSED': return '#9CA0B0';
            case 'TRAINING': return '#FFB84D';
            case 'CONFLICT': return '#FF6B6B';
            default: return '#9CA0B0';
        }
    };

    const getStateIcon = () => {
        switch (systemState) {
            case 'ACTIVE': return '▶️';
            case 'PAUSED': return '⏸️';
            case 'TRAINING': return '🧠';
            case 'CONFLICT': return '⚠️';
            default: return '⏸️';
        }
    };

    if (isMinimized) {
        return (
            <div 
                className="floating-widget minimized"
                style={{ left: position.x, top: position.y }}
                onMouseDown={handleMouseDown}
            >
                <button 
                    className="widget-restore"
                    onClick={() => setIsMinimized(false)}
                    title="Restore widget"
                >
                    <span style={{ color: getStateColor() }}>{getStateIcon()}</span>
                </button>
            </div>
        );
    }

    return (
        <div 
            className={`floating-widget ${isDragging ? 'dragging' : ''}`}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            <div className="widget-header">
                <div className="widget-title">
                    <span style={{ color: getStateColor() }}>{getStateIcon()}</span>
                    <span>GestureCtrl</span>
                </div>
                <button 
                    className="widget-minimize"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize"
                >
                    −
                </button>
            </div>

            <div className="widget-status">
                <div className="widget-status-row">
                    <span className="widget-label">Status:</span>
                    <span className="widget-value" style={{ color: getStateColor() }}>
                        {systemState}
                    </span>
                </div>
                <div className="widget-status-row">
                    <span className="widget-label">Mode:</span>
                    <span className="widget-value" style={{ color: cursorMode ? '#00A8A8' : '#9CA0B0' }}>
                        {cursorMode ? '🖱️ Cursor' : '✋ Gesture'}
                    </span>
                </div>
                {lastDetected && !cursorMode && (
                    <div className="widget-status-row">
                        <span className="widget-label">Last:</span>
                        <span className="widget-value">{lastDetected.name}</span>
                    </div>
                )}
            </div>

            <div className="widget-actions">
                <button 
                    className="widget-action widget-action-primary"
                    onClick={onToggleCursorMode}
                    disabled={systemState === 'TRAINING'}
                >
                    {cursorMode ? '✋ Gesture Mode' : '🖱️ Cursor Mode'}
                </button>
                {cursorMode && (
                    <button 
                        className="widget-action widget-action-secondary"
                        onClick={onOpenCursorSettings}
                        title="Configure cursor gestures"
                    >
                        ⚙️ Cursor Settings
                    </button>
                )}
                <button 
                    className="widget-action widget-action-primary"
                    onClick={onTogglePause}
                    disabled={systemState === 'TRAINING'}
                >
                    {systemState === 'ACTIVE' ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button 
                    className="widget-action widget-action-secondary"
                    onClick={onOpenDashboard}
                >
                    📊 Dashboard
                </button>
            </div>
        </div>
    );
}

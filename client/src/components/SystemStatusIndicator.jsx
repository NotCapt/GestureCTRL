import React from 'react';

export default function SystemStatusIndicator({ systemState, className = '' }) {
    const getStateConfig = () => {
        switch (systemState) {
            case 'ACTIVE':
                return {
                    color: '#00A8A8',
                    bgColor: 'rgba(0, 168, 168, 0.1)',
                    icon: '▶️',
                    label: 'ACTIVE',
                    description: 'Gesture detection is running'
                };
            case 'PAUSED':
                return {
                    color: '#9CA0B0',
                    bgColor: 'rgba(156, 160, 176, 0.1)',
                    icon: '⏸️',
                    label: 'PAUSED',
                    description: 'Gesture detection is paused'
                };
            case 'TRAINING':
                return {
                    color: '#FFB84D',
                    bgColor: 'rgba(255, 184, 77, 0.1)',
                    icon: '🧠',
                    label: 'TRAINING',
                    description: 'Model is being trained'
                };
            case 'CONFLICT':
                return {
                    color: '#FF6B6B',
                    bgColor: 'rgba(255, 107, 107, 0.1)',
                    icon: '⚠️',
                    label: 'CONFLICT',
                    description: 'Gesture conflict detected'
                };
            default:
                return {
                    color: '#9CA0B0',
                    bgColor: 'rgba(156, 160, 176, 0.1)',
                    icon: '⚪',
                    label: 'UNKNOWN',
                    description: 'System status unknown'
                };
        }
    };

    const config = getStateConfig();

    return (
        <div className={`system-status-indicator ${className}`}>
            <div 
                className="system-status-badge"
                style={{ 
                    backgroundColor: config.bgColor,
                    borderColor: config.color
                }}
            >
                <span className="system-status-icon">{config.icon}</span>
                <span 
                    className="system-status-label"
                    style={{ color: config.color }}
                >
                    {config.label}
                </span>
            </div>
            <div className="system-status-description">{config.description}</div>
        </div>
    );
}

import React from 'react';

export default function Header({ activeTab, setActiveTab, wsConnected, mlConnected, cameraOn }) {
    const statusClass = !wsConnected ? 'disconnected' : !mlConnected ? 'warning' : 'connected';
    const statusText = !wsConnected ? 'Disconnected' : !mlConnected ? 'ML Offline' : cameraOn ? 'Active' : 'Ready';

    return (
        <header className="header">
            <div className="header-brand">
                <span className="header-logo">GestureCtrl</span>
                <span className="header-version">v1.0</span>
            </div>

            <nav className="tab-nav">
                {['Gestures', 'Monitor', 'Settings'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'Gestures' && '🤚 '}
                        {tab === 'Monitor' && '📹 '}
                        {tab === 'Settings' && '⚙️ '}
                        {tab}
                    </button>
                ))}
            </nav>

            <div className="header-status">
                <div className={`status-dot ${statusClass}`} />
                <span>{statusText}</span>
            </div>
        </header>
    );
}

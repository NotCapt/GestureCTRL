import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = `ws://${window.location.hostname}:3001/ws`;
const API_URL = `http://${window.location.hostname}:3001/api`;

export function useBackend() {
    const [gestures, setGestures] = useState({});
    const [cameraOn, setCameraOn] = useState(false);
    const [mlConnected, setMlConnected] = useState(false);
    const [liveFrame, setLiveFrame] = useState(null);
    const [detected, setDetected] = useState(null);
    const [lastDetected, setLastDetected] = useState(null);
    const [recentDetections, setRecentDetections] = useState([]);
    const [recording, setRecording] = useState(null);
    const [trainState, setTrainState] = useState({ status: 'idle', progress: 0, accuracy: 0 });
    const [stats, setStats] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [cursorMode, setCursorMode] = useState(false);

    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const detectionTimer = useRef(null);
    const gesturesRef = useRef({});

    useEffect(() => {
        gesturesRef.current = gestures || {};
    }, [gestures]);

    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected to server');
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'connected':
                        setGestures(data.gestures || {});
                        setMlConnected(data.mlConnected || false);
                        break;

                    case 'ml_status':
                        setMlConnected(data.connected);
                        break;

                    case 'gesture_updated':
                        setGestures(data.gestures || {});
                        break;

                    case 'camera_status':
                        setCameraOn(data.active);
                        break;

                    case 'frame':
                        setLiveFrame(data.frame);
                        if (data.detection) {
                            const g = gesturesRef.current?.[data.detection.gestureId];
                            const snapshot = {
                                ...data.detection,
                                icon: g?.icon || '✋',
                                action: g?.action || 'none',
                                ts: Date.now(),
                            };

                            setDetected(snapshot);
                            setLastDetected(snapshot);
                            setRecentDetections((prev) => {
                                const next = [snapshot, ...(prev || [])];
                                return next.slice(0, 6);
                            });
                            if (detectionTimer.current) clearTimeout(detectionTimer.current);
                            detectionTimer.current = setTimeout(() => setDetected(null), 1500);
                        }
                        break;

                    case 'recording_started':
                        setRecording({ id: data.id, recorded: 0, total: data.total, active: true });
                        break;

                    case 'recording_progress':
                        setRecording({ id: data.id, recorded: data.recorded, total: data.total, active: data.active });
                        break;

                    case 'recording_stopped':
                        setRecording(null);
                        break;

                    case 'train_progress':
                        setTrainState({ status: 'training', progress: data.progress, accuracy: data.accuracy || 0, statusText: data.status });
                        break;

                    case 'train_complete':
                        setTrainState({ status: 'complete', progress: 100, accuracy: data.accuracy });
                        setTimeout(() => setTrainState(s => ({ ...s, status: 'idle' })), 3000);
                        break;

                    case 'stats':
                        setStats(data);
                        break;

                    case 'cursor_mode_changed':
                        setCursorMode(data.enabled);
                        break;

                    case 'error':
                        console.error('[WS] Error from server:', data.message);
                        break;

                    default:
                        break;
                }
            } catch (e) {
                // ignore parse errors
            }
        };

        ws.onclose = () => {
            console.log('[WS] Disconnected');
            setWsConnected(false);
            setLiveFrame(null);
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (detectionTimer.current) clearTimeout(detectionTimer.current);
        };
    }, [connect]);

    const send = useCallback((msg) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    // REST helpers
    const api = useCallback(async (method, path, body) => {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}${path}`, opts);
        return res.json();
    }, []);

    const addGesture = useCallback((name, icon, action, cursorAction) =>
        api('POST', '/gestures', { name, icon, action, cursorAction }), [api]);

    const updateGesture = useCallback((id, name, icon, action, cursorAction) =>
        api('PATCH', `/gestures/${id}`, { name, icon, action, cursorAction }), [api]);

    const deleteGesture = useCallback((id) =>
        api('DELETE', `/gestures/${id}`), [api]);

    const toggleGesture = useCallback((id, active) =>
        api('PATCH', `/gestures/${id}/toggle`, { active }), [api]);

    const startCamera = useCallback(() =>
        api('POST', '/camera/start'), [api]);

    const stopCamera = useCallback(() =>
        api('POST', '/camera/stop'), [api]);

    const startRecording = useCallback((id, total = 80) =>
        api('POST', `/gestures/${id}/record`, { total }), [api]);

    const stopRecording = useCallback((id) =>
        api('POST', `/gestures/${id}/stop-record`), [api]);

    const trainModel = useCallback(() =>
        api('POST', '/train'), [api]);

    const updateSettings = useCallback((settings) =>
        api('POST', '/settings', settings), [api]);

    const toggleCursorMode = useCallback(() =>
        send({ type: 'toggle_cursor_mode' }), [send]);

    const updateCursorSettings = useCallback((settings) =>
        send({ type: 'update_cursor_settings', settings }), [send]);

    return {
        // State
        gestures,
        cameraOn,
        mlConnected,
        wsConnected,
        liveFrame,
        detected,
        lastDetected,
        recentDetections,
        recording,
        trainState,
        stats,
        cursorMode,
        // Actions
        send,
        addGesture,
        updateGesture,
        deleteGesture,
        toggleGesture,
        startCamera,
        stopCamera,
        startRecording,
        stopRecording,
        trainModel,
        updateSettings,
        toggleCursorMode,
        updateCursorSettings,
    };
}

import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePose } from '../hooks/usePose';
import { useMetricsTracker } from '../hooks/useMetricsTracker';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { getDrills, DRILL_LIBRARY } from '../utils/drillLibrary';
import DrillDemo from '../components/DrillDemo';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function AssessmentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const preselectedId = location.state?.preselect || null;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const lastDescRef = useRef(null);
    const sessionEndedRef = useRef(false); // guard against double-fire

    const [selectedExId, setSelectedExId] = useState(preselectedId);
    const [showDemo, setShowDemo] = useState(!!preselectedId);
    const [isActive, setIsActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [sessionDone, setSessionDone] = useState(false);
    const [sessionResult, setSessionResult] = useState(null);

    const [isUpload, setIsUpload] = useState(false);
    const [videoSrc, setVideoSrc] = useState(null);

    // Person lock
    const [personLocked, setPersonLocked] = useState(false);
    const [lockTarget, setLockTarget] = useState(null);
    const [isPersonLost, setIsPersonLost] = useState(false);

    // Selected drill object
    const selectedEx = selectedExId ? DRILL_LIBRARY[selectedExId] : null;
    const trackAsType = selectedEx?.trackAs || 'jump';

    const { metrics, feedback, phase, stopTracking, processLandmarks, reset } = useMetricsTracker(trackAsType);
    const { speak } = useVoiceAssistant();

    // End session trigger — use a ref guard so this only fires once
    useEffect(() => {
        if (phase === 'COMPLETE' && !sessionEndedRef.current) {
            sessionEndedRef.current = true;
            handleEndSession();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Pose result handler
    const handlePoseResults = useCallback((results, isLost) => {
        setIsPersonLost(!!isLost);
        if (results?.poseLandmarks && !isLost && phase !== 'COMPLETE') {
            processLandmarks(results.poseLandmarks);
        }
    }, [processLandmarks, phase]);

    const handleLockData = useCallback((desc) => { lastDescRef.current = desc; }, []);
    usePose(videoRef, canvasRef, handlePoseResults, isActive, personLocked, handleLockData, lockTarget, isUpload);

    const startCamera = async () => {
        if (!selectedExId) return alert('⚠️ Please select a drill before starting!');
        setCameraError('');
        setIsUpload(false);
        setVideoSrc(null);
        reset();
        sessionEndedRef.current = false;
        try {
            // Verify camera permissions without locking the webcam
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }, audio: false,
            });

            // Stop tracks immediately so MediaPipe Camera can take over cleanly
            stream.getTracks().forEach(t => t.stop());

            setIsActive(true);
            speak(`Starting ${selectedEx?.label}. Gathering baseline... Go on your mark!`, true);
        } catch (err) {
            setCameraError(err.name === 'NotAllowedError'
                ? '🚫 Camera permission denied. Allow camera access in browser settings.'
                : `❌ Camera error: ${err.message}`);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!selectedExId) return alert('⚠️ Please select a drill before uploading!');

        // Explicitly stop any active webcam streams first
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }

        setCameraError('');
        setIsUpload(true);
        reset();
        sessionEndedRef.current = false;
        setIsActive(true);
        speak(`Analyzing uploaded video for ${selectedEx?.label}...`, true);

        const url = URL.createObjectURL(file);
        setVideoSrc(url);

        if (videoRef.current) {
            const video = videoRef.current;
            video.src = url;
            video.style.transform = 'scaleX(1)';

            video.onloadeddata = () => {
                video.play().catch(e => console.error("Error playing video:", e));
            };

            video.load();
        }
    };

    const stopCamera = () => {
        setIsActive(false);
        setPersonLocked(false);
        setLockTarget(null);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
            setVideoSrc(null);
        }
    };

    const handleLockPerson = () => {
        if (lastDescRef.current) {
            setLockTarget(lastDescRef.current);
            setPersonLocked(true);
            speak('Athlete locked.', true);
        }
    };

    const handleUnlockPerson = () => {
        setPersonLocked(false);
        setLockTarget(null);
        setIsPersonLost(false);
    };

    const handleEndSession = async () => {
        stopCamera();
        setSubmitting(true);
        speak('Drill complete. Analyzing talent metrics.', true);

        try {
            const payload = {
                drillType: selectedExId,
                motionTrackingData: [], // Would send actual keyframes in a full app
                performanceMetrics: { 
                    maxVelocity: metrics.maxVelocity, 
                    maxVerticalVelocity: metrics.maxVerticalVelocity,
                    maxHorizontalVelocity: metrics.maxHorizontalVelocity,
                    time: metrics.time 
                },
                biomechanicsAnalysis: { formScore: metrics.postureScore },
                duration: Number(metrics.time),
                talentScore: 0 // to be overwritten by AI if needed, or by analyze route
            };

            // First analyze to get scout report & score
            const analyzeRes = await api.post('/analyze', payload);
            const aiEval = analyzeRes.data.evaluation;

            payload.talentScore = aiEval.talentScore;

            // Then save complete assessment
            await api.post('/assessment/complete', payload);

            setSessionResult({
                drillType: selectedEx?.label,
                ...payload,
                aiEval
            });
            setSessionDone(true);
        } catch (err) {
            console.error(err);
            setSessionDone(true);
            setSessionResult({
                drillType: selectedEx?.label,
                performanceMetrics: { maxVelocity: metrics.maxVelocity, time: metrics.time },
                talentScore: 0,
                aiEval: null
            });
        } finally { setSubmitting(false); }
    };

    if (showDemo && selectedEx) {
        return (
            <div className="page-shell">
                <Navbar />
                <DrillDemo
                    exercise={selectedEx}
                    onStartWorkout={() => setShowDemo(false)}
                    onChangeExercise={() => { setShowDemo(false); setSelectedExId(null); navigate('/drills'); }}
                />
            </div>
        );
    }

    if (sessionDone && sessionResult) {
        return (
            <div className="page-shell">
                <Navbar />
                <main className="session-result">
                    <div className="result-card" style={{ maxWidth: '800px' }}>
                        <div className="result-icon">🏅</div>
                        <h1>Combine Assessment Complete</h1>
                        <h2>{sessionResult.drillType}</h2>

                        {sessionResult.aiEval && (
                            <div className="scout-report" style={{ marginTop: '20px', textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                <h3 style={{ color: '#00f5d4', borderBottom: '1px solid rgba(0,245,212,0.3)', paddingBottom: '10px', marginBottom: '15px' }}>Sports Scout Analysis</h3>
                                <p style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Overall Talent Score: {sessionResult.aiEval.talentScore}/100</p>

                                {sessionResult.aiEval.coachInsight && (
                                    <div style={{ background: 'rgba(167, 139, 250, 0.1)', borderLeft: '4px solid #a78bfa', padding: '15px', marginBottom: '20px', borderRadius: '0 8px 8px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#a78bfa', fontWeight: 'bold' }}>
                                            <span>🤖</span> AI Coach Insight
                                        </div>
                                        <p style={{ margin: 0, lineHeight: '1.5', fontSize: '15px', color: 'var(--text-secondary)' }}>
                                            {sessionResult.aiEval.coachInsight}
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div><strong style={{ color: '#a78bfa' }}>Athletic Potential:</strong> {sessionResult.aiEval.athleticPotential}</div>
                                    <div><strong style={{ color: '#a78bfa' }}>Speed Assessment:</strong> {sessionResult.aiEval.speedAssessment}</div>
                                    <div><strong style={{ color: '#a78bfa' }}>Power Assessment:</strong> {sessionResult.aiEval.explosivePowerAssessment}</div>
                                    <div><strong style={{ color: '#a78bfa' }}>Agility Assessment:</strong> {sessionResult.aiEval.agilityAssessment}</div>
                                    <div><strong style={{ color: '#a78bfa' }}>Biomechanics:</strong> {sessionResult.aiEval.biomechanicsAssessment}</div>
                                </div>
                            </div>
                        )}

                        <div className="result-stats" style={{ marginTop: '20px' }}>
                            <div className="result-stat"><span className="rs-value">{sessionResult.performanceMetrics.maxVelocity}</span><span className="rs-label">Max Velocity</span></div>
                            <div className="result-stat"><span className="rs-value">{sessionResult.performanceMetrics.time}s</span><span className="rs-label">Duration</span></div>
                        </div>
                        <div className="result-actions" style={{ marginTop: '30px' }}>
                            <button className="btn btn-primary" onClick={() => { navigate('/drills'); }}>
                                📚 Return to Library
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>📊 Dashboard</button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Navbar />
            <main className="workout-page">
                <div className="workout-header">
                    <div className="header-left">
                        <h1>🏃 Tracking: {selectedEx?.label || 'Combine Test'}</h1>
                        {isActive && <span className="live-badge">● RECORDING</span>}
                        {isActive && personLocked && (
                            <span className={`lock-badge ${isPersonLost ? 'lock-lost' : 'lock-ok'}`}>
                                {isPersonLost ? '🟡 Athlete Lost' : '🔒 Athlete Tracking Locked'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="workout-layout">
                    {/* ─── CAMERA ─────────────────────────────── */}
                    <div className="camera-container">
                        {!isActive && !cameraError && (
                            <div className="camera-placeholder">
                                <div className="camera-icon">📷</div>
                                <p>Ready to track {selectedEx?.label}?</p>
                            </div>
                        )}
                        {cameraError && <div className="camera-error"><p>{cameraError}</p></div>}

                        <video ref={videoRef} className="workout-video" playsInline muted src={videoSrc || undefined} crossOrigin="anonymous"
                            style={{ display: isActive ? 'block' : 'none', transform: isUpload ? 'scaleX(1)' : 'scaleX(-1)' }} />
                        <canvas ref={canvasRef} className="pose-canvas"
                            style={{ display: isActive ? 'block' : 'none', transform: isUpload ? 'scaleX(1)' : 'scaleX(-1)' }} />

                        <div className="camera-controls">
                            {!isActive ? (
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <button className="btn btn-primary btn-lg" onClick={startCamera}>🎥 Start Capture</button>
                                    <span style={{ color: 'var(--text-muted)' }}>or</span>
                                    <label className="btn btn-secondary btn-lg" style={{ cursor: 'pointer', margin: 0 }}>
                                        📁 Upload Video
                                        <input
                                            type="file"
                                            accept="video/mp4,video/mov,video/webm"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                </div>
                            ) : (
                                <div className="active-controls">
                                    {!personLocked
                                        ? <button className="btn btn-lock" onClick={handleLockPerson}>🔒 Lock Subject</button>
                                        : <button className="btn btn-unlock" onClick={handleUnlockPerson}>🔓 Unlock</button>}
                                    <button className="btn btn-danger btn-lg" onClick={stopTracking} disabled={submitting || phase === 'COMPLETE'}>
                                        {submitting ? <span className="spinner" /> : '⏹ End & Analyze'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── FEEDBACK PANEL ─────────────────────── */}
                    <div className="feedback-panel">
                        <div className="panel-card timer-card">
                            <div className="timer-display" style={{ fontSize: '48px' }}>{metrics.time}s</div>
                            <div className="timer-label">TIME ACTIVE</div>
                        </div>

                        <div className="panel-card reps-card">
                            <div className="big-number" style={{ color: '#00f5ff' }}>{metrics.maxVelocity}</div>
                            <div className="panel-label">MAX OUTPUT VELOCITY</div>
                        </div>

                        <div className="panel-card accuracy-card">
                            <div className="big-number" style={{ color: metrics.postureScore >= 80 ? '#22c55e' : '#f59e0b' }}>
                                {metrics.postureScore}/100
                            </div>
                            <div className="panel-label">BIOMECHANICS SCORE (PROXY)</div>
                        </div>

                        <div className="panel-card feedback-card">
                            <div className="feedback-message" style={{ color: phase === 'ACTIVE' ? '#22c55e' : '#fff' }}>{feedback}</div>
                            <div className="panel-label">SCOUT STATUS</div>
                        </div>
                    </div>
                </div>

                <style>{`
                    .lock-badge { font-size:12px; padding:3px 10px; border-radius:10px; margin-left:12px; font-weight:700; }
                    .lock-ok   { background:rgba(0,245,212,0.15); color:#00f5d4; border:1px solid #00f5d4; }
                    .lock-lost { background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid #f59e0b; animation:pulse 1s ease infinite; }
                    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
                    .active-controls { display:flex; gap:10px; align-items:center; }
                    .btn-lock   { padding:10px 18px; background:rgba(0,245,212,0.15); border:1px solid #00f5d4; color:#00f5d4; border-radius:10px; cursor:pointer; font-weight:700; font-size:13px; }
                    .btn-unlock { padding:10px 18px; background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#f87171; border-radius:10px; cursor:pointer; font-weight:700; font-size:13px; }
                `}</style>
            </main>
        </div>
    );
}

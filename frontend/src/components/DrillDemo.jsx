import { getDrills } from '../utils/drillLibrary';

// Fallback for any drill not found
const DEFAULT_DEMO = {
    label: 'Assessment Drill',
    description: 'A standardized sports combine drill.',
    trackLabel: 'Movement tracking',
};

// ── Main DrillDemo Component ─────────────────────────────────
export default function DrillDemo({ exercise, onStartWorkout, onChangeExercise }) {
    // exercise here is passed from AssessmentPage (from DRILL_LIBRARY)
    const demo = exercise || DEFAULT_DEMO;

    return (
        <div className="demo-shell">
            {/* ── TOP BAR ───────────────────────────────────── */}
            <div className="demo-topbar">
                <button className="demo-back" onClick={onChangeExercise}>← Back to Drills</button>
                <div className="demo-title-area">
                    <span className="demo-ex-icon">{demo?.icon || '⏱'}</span>
                    <h2>{demo.label}</h2>
                </div>
            </div>

            {/* ── MAIN CONTENT ──────────────────────────────── */}
            <div className="demo-body">
                {/* LEFT — Animation panel */}
                <div className="demo-animation-panel">
                    <div className="demo-yt-stage">
                        {demo?.ytId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${demo.ytId}?autoplay=1&mute=1&loop=1&playlist=${demo.ytId}&controls=0&modestbranding=1`}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={demo.label}
                                className="yt-iframe"
                            />
                        ) : (
                            <div className="demo-no-video">Demo video unavailable</div>
                        )}
                    </div>
                </div>

                {/* RIGHT — Info panel */}
                <div className="demo-tips-panel">
                    <h3>📋 Protocol Requirements</h3>
                    <p className="demo-desc">{demo.description}</p>

                    <div className="demo-sets-card" style={{ marginTop: '20px' }}>
                        <span className="sets-label">Tracking Metric</span>
                        <span className="sets-value">{demo.trackLabel}</span>
                        <span className="track-mode">Target: Max Velocity & Efficiency</span>
                    </div>
                </div>
            </div>

            <div className="demo-footer">
                <button className="btn-demo-change" onClick={onChangeExercise}>Cancel</button>
                <button className="btn-demo-start" onClick={onStartWorkout}>
                    ▶️ Proceed to Assessment — {demo.label}
                </button>
            </div>

            {/* ── STYLES ────────────────────────────────────── */}
            <style>{`
                /* ── Layout ───────────────────────────────── */
                .demo-shell { min-height:100vh; display:flex; flex-direction:column; color:white; font-family:'Inter',sans-serif; }
                .demo-topbar { display:flex; align-items:center; gap:20px; padding:20px 32px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; }
                .demo-back { padding:8px 16px; background:transparent; border:1px solid rgba(255,255,255,0.14); color:#aaa; border-radius:8px; cursor:pointer; font-size:13px; }
                .demo-back:hover { color:white; border-color:rgba(255,255,255,0.3); }
                .demo-title-area { display:flex; align-items:center; gap:10px; flex:1; }
                .demo-ex-icon { font-size:24px; }
                .demo-title-area h2 { font-size:20px; font-weight:800; }

                .demo-body { display:grid; grid-template-columns:1fr 380px; gap:32px; padding:32px; flex:1; }
                @media(max-width:900px){ .demo-body { grid-template-columns:1fr; } }

                /* ── Video Stage ──────────────────────── */
                .demo-animation-panel { display:flex; flex-direction:column; gap:20px; }
                .demo-yt-stage { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:20px; aspect-ratio:16/9; display:flex; align-items:center; justify-content:center; overflow:hidden; }
                .yt-iframe { width:100%; height:100%; border:none; border-radius:20px; }
                .demo-no-video { color:rgba(255,255,255,0.4); font-size:14px; }

                /* ── Tips Panel ───────────────────────────── */
                .demo-tips-panel { display:flex; flex-direction:column; gap:20px; }
                .demo-tips-panel h3 { font-size:14px; color:#888; text-transform:uppercase; letter-spacing:1px; margin:0; }
                .demo-desc { font-size:15px; color:#e2e8f0; line-height:1.5; padding: 16px; background:rgba(255,255,255,0.02); border-radius: 12px; }
                .demo-sets-card { background:rgba(0,245,212,0.06); border:1px solid rgba(0,245,212,0.15); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:4px; margin-top:auto; }
                .sets-label { font-size:10px; color:#555; text-transform:uppercase; letter-spacing:0.5px; }
                .sets-value { font-size:16px; font-weight:800; color:#00f5d4; }
                .track-mode { font-size:11px; color:#888; margin-top: 5px; }

                /* ── Footer ───────────────────────────────── */
                .demo-footer { display:flex; justify-content:center; gap:16px; padding:24px 32px; background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.06); }
                .btn-demo-change { padding:13px 28px; background:transparent; border:1px solid rgba(255,255,255,0.12); color:#888; border-radius:12px; cursor:pointer; font-size:14px; font-weight:600; }
                .btn-demo-change:hover { color:white; border-color:rgba(255,255,255,0.25); }
                .btn-demo-start { padding:13px 40px; background:linear-gradient(135deg,#00f5d4,#7c3aed); color:white; border:none; border-radius:12px; cursor:pointer; font-size:15px; font-weight:800; letter-spacing:0.5px; box-shadow:0 0 30px rgba(0,245,212,0.2); transition:all 0.2s; }
                .btn-demo-start:hover { transform:translateY(-2px); box-shadow:0 0 40px rgba(0,245,212,0.35); }
            `}</style>
        </div>
    );
}

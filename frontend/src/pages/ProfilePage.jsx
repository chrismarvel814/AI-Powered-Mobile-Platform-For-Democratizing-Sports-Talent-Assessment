import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const SPORT_LABELS = { basketball: '🏀 Basketball', football: '🏈 Football', soccer: '⚽ Soccer', tennis: '🎾 Tennis', baseball: '⚾ Baseball', track_and_field: '🏃 Track', other: '🏅 Other' };

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [stats, setStats] = useState({ consistencyStreak: 0, averageAccuracy: 0, totalWorkoutsCompleted: 0, bestSessionScore: 0 });
    const [sessionDates, setSessionDates] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [weightHistory, setWeightHistory] = useState(() => JSON.parse(localStorage.getItem('weight_history') || '[]'));
    const [newWeight, setNewWeight] = useState('');

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (isEditing) setForm({ ...user }); }, [isEditing]);

    const fetchData = async () => {
        try {
            const [meRes, summaryRes, chartsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/progress/summary'),
                api.get('/progress/charts?limit=365'),
            ]);
            const u = meRes.data.data;
            setUser(u);
            setStats(summaryRes.data.data);
            setSessionDates(chartsRes.data.data.dates || []);
            localStorage.setItem('user', JSON.stringify(u));
        } catch (err) { console.error('Profile fetch error:', err); }
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', {
                ...form,
                age: Number(form.age) || undefined,
                height: Number(form.height) || undefined,
                weight: Number(form.weight) || undefined,
                wingspan: Number(form.wingspan) || undefined,
            });
            const updated = data.data;
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));

            // If weight changed, append to history
            if (Number(form.weight) && Number(form.weight) !== user.weight) {
                const newHist = [...weightHistory, { weight: Number(form.weight), date: new Date().toISOString() }];
                setWeightHistory(newHist);
                localStorage.setItem('weight_history', JSON.stringify(newHist));
            }

            setIsEditing(false);
            showMsg('Profile updated! ✅', 'success');
        } catch { showMsg('Save failed ❌', 'error'); }
        finally { setLoading(false); }
    };

    const addWeightEntry = () => {
        const w = Number(newWeight);
        if (!w || w < 20 || w > 400) return showMsg('Enter a valid weight (20-400 kg)', 'error');
        const entry = { weight: w, date: new Date().toISOString() };
        const newHist = [...weightHistory, entry];
        setWeightHistory(newHist);
        localStorage.setItem('weight_history', JSON.stringify(newHist));
        setNewWeight('');
        showMsg('Weight logged!', 'success');
    };

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // ── Metric Calculation ──────────────────────────────────────────
    const wingspanRatio = useMemo(() => {
        if (!user.height || !user.wingspan) return null;
        const ratio = (user.wingspan / user.height).toFixed(2);
        let cat = 'Average', clr = '#00f5d4';
        if (ratio > 1.05) { cat = 'Plus Ape Index'; clr = '#7c3aed'; }
        else if (ratio < 0.95) { cat = 'Minus Ape Index'; clr = '#f97316'; }
        return { v: ratio, cat, clr };
    }, [user]);

    // ── Weight History ───────────────────────────────────────────
    const weightDelta = useMemo(() => {
        if (weightHistory.length < 2) return null;
        const first = weightHistory[0].weight;
        const last = weightHistory[weightHistory.length - 1].weight;
        const delta = (last - first).toFixed(1);
        const pct = ((Math.abs(delta) / first) * 100).toFixed(1);
        return { delta, pct, first, last };
    }, [weightHistory]);

    // ── Activity Heatmap (16 weeks) ──────────────────────────────
    const heatmap = useMemo(() => {
        const weeks = [];
        const today = new Date();
        const WEEKS = 16;
        for (let w = WEEKS - 1; w >= 0; w--) {
            const week = [];
            for (let d = 6; d >= 0; d--) {
                const date = new Date(today);
                date.setDate(today.getDate() - (w * 7 + d));
                const dStr = date.toISOString().split('T')[0];
                const count = sessionDates.filter(s => s === dStr).length;
                week.push({ date: dStr, count });
            }
            weeks.push(week);
        }
        return weeks;
    }, [sessionDates]);

    // Active days this month
    const activeDaysThisMonth = useMemo(() => {
        const now = new Date();
        const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return [...new Set(sessionDates.filter(d => d.startsWith(m)))].length;
    }, [sessionDates]);

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="page-shell">
            <Navbar />

            {message.text && (
                <div className={`msg-pill ${message.type}`}>{message.text}</div>
            )}

            <main className="pf-main">
                {/* ─── SECTION 1: HEADER ─────────────────────────────── */}
                <header className="pf-header">
                    <div className="pf-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="pf-title">
                        <h1>{user.name || 'Your Profile'}</h1>
                        <p>{user.email} <span className="pill">{(user.position || 'Athlete').toUpperCase()}</span></p>
                        <div className="pf-tags">
                            {user.primarySport && <span className="tag">{SPORT_LABELS[user.primarySport]}</span>}
                            {user.dominantHand && <span className="tag">✋ {user.dominantHand} Handed</span>}
                        </div>
                    </div>
                    <div className="pf-actions">
                        <button className="btn-soft" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? '✕ Cancel' : '✏️ Edit'}
                        </button>
                        <button className="btn-logout" onClick={handleLogout}>Logout</button>
                    </div>
                </header>

                <div className="pf-grid">
                    {/* ─── LEFT COLUMN ─────────────────────────────────── */}
                    <div className="pf-left">
                        {/* SECTION 2: EDITABLE DETAILS */}
                        <section className="pf-card">
                            <h3>{isEditing ? 'Edit Profile' : 'Personal Details'}</h3>
                            {isEditing ? (
                                <form onSubmit={handleSave}>
                                    <div className="f-section-title">Personal Metrics</div>
                                    <div className="f-grid-2">
                                        <div className="f-field"><label>Age</label><input type="number" value={form.age || ''} onChange={e => set('age', e.target.value)} placeholder="28" /></div>
                                        <div className="f-field">
                                            <label>Gender</label>
                                            <select value={form.gender || ''} onChange={e => set('gender', e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="f-field"><label>Height (cm)</label><input type="number" value={form.height || ''} onChange={e => set('height', e.target.value)} placeholder="175" /></div>
                                        <div className="f-field"><label>Weight (kg)</label><input type="number" value={form.weight || ''} onChange={e => set('weight', e.target.value)} placeholder="70" /></div>
                                        <div className="f-field"><label>Wingspan (cm)</label><input type="number" value={form.wingspan || ''} onChange={e => set('wingspan', e.target.value)} placeholder="180" /></div>
                                        <div className="f-field">
                                            <label>Dominant Hand</label>
                                            <select value={form.dominantHand || ''} onChange={e => set('dominantHand', e.target.value)}>
                                                <option value="right">Right</option>
                                                <option value="left">Left</option>
                                                <option value="ambidextrous">Ambidextrous</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="f-section-title">Athletic Profile</div>
                                    <div className="f-grid-2">
                                        <div className="f-field">
                                            <label>Primary Sport</label>
                                            <select value={form.primarySport || ''} onChange={e => set('primarySport', e.target.value)}>
                                                <option value="basketball">Basketball</option>
                                                <option value="football">Football</option>
                                                <option value="soccer">Soccer</option>
                                                <option value="tennis">Tennis</option>
                                                <option value="baseball">Baseball</option>
                                                <option value="track_and_field">Track & Field</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="f-field">
                                            <label>Position / Specialty</label>
                                            <input type="text" value={form.position || ''} onChange={e => set('position', e.target.value)} placeholder="e.g. Guard" />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? 'Saving...' : '💾 Save Changes'}
                                    </button>
                                </form>
                            ) : (
                                <div className="detail-grid">
                                    {[
                                        ['Age', user.age ? `${user.age} yrs` : '—'],
                                        ['Gender', user.gender || '—'],
                                        ['Height', user.height ? `${user.height} cm` : '—'],
                                        ['Weight', user.weight ? `${user.weight} kg` : '—'],
                                        ['Wingspan', user.wingspan ? `${user.wingspan} cm` : '—'],
                                        ['Primary Sport', user.primarySport ? SPORT_LABELS[user.primarySport] : '—'],
                                        ['Position', user.position || '—'],
                                        ['Dominant Hand', user.dominantHand ? user.dominantHand.charAt(0).toUpperCase() + user.dominantHand.slice(1) : '—'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="detail-row">
                                            <span className="dk">{k}</span>
                                            <span className="dv">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* SECTION 3: WINGSPAN */}
                        {wingspanRatio && (
                            <section className="pf-card bmi-section">
                                <h3>Ape Index (Wingspan to Height Ratio)</h3>
                                <div className="bmi-main">
                                    <div className="bmi-circle" style={{ borderColor: wingspanRatio.clr }}>
                                        <span className="bmi-num">{wingspanRatio.v}</span>
                                        <span className="bmi-lbl" style={{ color: wingspanRatio.clr }}>{wingspanRatio.cat}</span>
                                    </div>
                                    <div className="bmi-info">
                                        <div className="bmi-range">Your wingspan is <strong>{user.wingspan} cm</strong> and height is <strong>{user.height} cm</strong>.</div>
                                        <p className="bmi-tip">
                                            {wingspanRatio.cat === 'Plus Ape Index'
                                                ? '✅ Great for sports like basketball, swimming, and climbing!'
                                                : wingspanRatio.cat === 'Average'
                                                    ? '💪 A balanced wingspan-to-height ratio, versatile for most sports.'
                                                    : '⚡ Shorter levers can be highly advantageous in sports like gymnastics and weightlifting.'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Weight History */}
                        <section className="pf-card">
                            <h3>Weight Progress</h3>
                            {weightDelta && (
                                <div className="weight-delta" style={{ color: weightDelta.delta < 0 ? '#00f5d4' : '#f97316' }}>
                                    {weightDelta.delta > 0 ? '↑' : '↓'} {Math.abs(weightDelta.delta)} kg
                                    <span className="wd-meta"> ({weightDelta.pct}% change from {weightDelta.first}kg)</span>
                                </div>
                            )}
                            <div className="wh-list">
                                {weightHistory.slice(-5).reverse().map((e, i) => (
                                    <div key={i} className="wh-row">
                                        <span>{new Date(e.date).toLocaleDateString()}</span>
                                        <strong>{e.weight} kg</strong>
                                    </div>
                                ))}
                                {weightHistory.length === 0 && <p className="no-data">No weight entries yet.</p>}
                            </div>
                            <div className="wh-add">
                                <input type="number" placeholder="Log today's weight (kg)" value={newWeight} onChange={e => setNewWeight(e.target.value)} />
                                <button onClick={addWeightEntry}>+ Log</button>
                            </div>
                        </section>
                    </div>

                    {/* ─── RIGHT COLUMN ────────────────────────────────── */}
                    <div className="pf-right">
                        {/* SECTION 5: STATS */}
                        <section className="pf-card">
                            <h3>Activity Statistics</h3>
                            <div className="stats-grid">
                                {[
                                    { label: 'Total Assessments', value: stats.totalAssessments ?? 0, icon: '🏆' },
                                    { label: 'Assessment Streak', value: `${stats.consistencyStreak ?? 0} days`, icon: '🔥' },
                                    { label: 'Avg Talent Score', value: `${stats.averageTalentScore ?? 0}`, icon: '🎯' },
                                    { label: 'Best Score', value: stats.bestTalentScore ?? 0, icon: '⭐' },
                                    { label: 'Active This Month', value: `${activeDaysThisMonth} days`, icon: '📅' },
                                ].map(s => (
                                    <div key={s.label} className="stat-box">
                                        <span className="sb-icon">{s.icon}</span>
                                        <span className="sb-val">{s.value}</span>
                                        <span className="sb-label">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* SECTION 4: HEATMAP */}
                        <section className="pf-card">
                            <h3>Activity Heatmap <span className="hm-sub">Last 16 weeks</span></h3>
                            <div className="heatmap">
                                {heatmap.map((week, wi) => (
                                    <div key={wi} className="hm-col">
                                        {week.map((day, di) => (
                                            <div
                                                key={di}
                                                className="hm-cell"
                                                data-level={Math.min(day.count, 3)}
                                                title={`${day.date}: ${day.count} session(s)`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="hm-legend">
                                <span>Less</span>
                                {[0, 1, 2, 3].map(l => <div key={l} className="hm-cell" data-level={l} />)}
                                <span>More</span>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <style>{`
                :root { --bg: #0a0d1a; --card: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.06); --cyan: #00f5d4; --purple: #7c3aed; }
                .pf-main { padding: 40px; max-width: 1300px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; color: white; }

                .pf-header { display: flex; align-items: center; gap: 24px; padding: 28px 32px; background: var(--card); border: 1px solid var(--border); border-radius: 20px; backdrop-filter: blur(20px); }
                .pf-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--cyan), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: white; flex-shrink: 0; }
                .pf-title { flex: 1; }
                .pf-title h1 { font-size: 22px; margin-bottom: 4px; }
                .pf-title p { font-size: 13px; color: #999; margin-bottom: 10px; }
                .pill { background: rgba(0,245,212,0.15); color: var(--cyan); padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-left: 8px; }
                .pf-tags { display: flex; gap: 8px; flex-wrap: wrap; }
                .tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 20px; font-size: 11px; color: #ccc; }
                .pf-actions { display: flex; flex-direction: column; gap: 8px; }
                .btn-soft { padding: 8px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 8px; cursor: pointer; font-size: 13px; }
                .btn-soft:hover { background: rgba(255,255,255,0.08); }
                .btn-logout { padding: 8px 18px; border: 1px solid rgba(239,68,68,0.3); background: transparent; color: #f87171; border-radius: 8px; cursor: pointer; font-size: 13px; }
                .btn-logout:hover { background: rgba(239,68,68,0.1); }

                .pf-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
                .pf-left, .pf-right { display: flex; flex-direction: column; gap: 24px; }

                .pf-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; backdrop-filter: blur(10px); }
                .pf-card h3 { font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
                .hm-sub { font-size: 10px; color: #444; text-transform: none; letter-spacing: 0; }

                /* Detail View */
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .detail-row { background: rgba(255,255,255,0.02); padding: 12px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 2px; }
                .dk { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
                .dv { font-size: 14px; font-weight: 600; }

                /* Edit Form */
                .f-section-title { font-size: 11px; text-transform: uppercase; color: var(--cyan); letter-spacing: 1px; margin: 20px 0 12px; font-weight: 700; }
                .f-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .f-field { display: flex; flex-direction: column; gap: 6px; }
                .f-field label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
                .f-field input, .f-field select { padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; border-radius: 8px; font-size: 14px; }
                .f-field input:focus, .f-field select:focus { outline: none; border-color: var(--cyan); }
                .btn-save { width: 100%; padding: 12px; background: linear-gradient(135deg, var(--cyan), var(--purple)); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 20px; }
                .btn-save:disabled { opacity: 0.5; }

                /* BMI */
                .bmi-main { display: flex; gap: 28px; align-items: flex-start; }
                .bmi-circle { width: 110px; height: 110px; border-radius: 50%; border: 4px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
                .bmi-num { font-size: 28px; font-weight: 900; }
                .bmi-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                .bmi-info { flex: 1; }
                .bmi-range { font-size: 13px; color: #aaa; margin-bottom: 12px; }
                .bmi-scale { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
                .scale-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
                .scale-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .scale-range { color: #666; margin-left: auto; }
                .bmi-tip { font-size: 12px; color: #aaa; line-height: 1.6; }

                /* Weight History */
                .weight-delta { font-size: 24px; font-weight: 900; margin-bottom: 16px; }
                .wd-meta { font-size: 13px; color: #888; font-weight: normal; }
                .wh-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
                .wh-row { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; }
                .wh-add { display: flex; gap: 8px; }
                .wh-add input { flex: 1; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; border-radius: 8px; font-size: 13px; }
                .wh-add button { padding: 10px 16px; background: var(--cyan); color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; }
                .no-data { color: #555; font-size: 13px; text-align: center; padding: 12px; }

                /* Stats */
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .stat-box { background: rgba(255,255,255,0.02); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
                .sb-icon { font-size: 20px; }
                .sb-val { font-size: 20px; font-weight: 900; color: var(--cyan); }
                .sb-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }

                /* Heatmap */
                .heatmap { display: flex; gap: 3px; overflow-x: auto; padding-bottom: 4px; }
                .hm-col { display: flex; flex-direction: column; gap: 3px; }
                .hm-cell { width: 13px; height: 13px; border-radius: 2px; background: rgba(255,255,255,0.04); flex-shrink: 0; cursor: default; }
                .hm-cell[data-level="1"] { background: #0d3321; }
                .hm-cell[data-level="2"] { background: #006d32; }
                .hm-cell[data-level="3"] { background: #26a641; }
                .hm-legend { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 10px; font-size: 10px; color: #555; }

                .msg-pill { position: fixed; top: 80px; right: 32px; padding: 12px 24px; border-radius: 30px; font-size: 13px; font-weight: 700; z-index: 9999; animation: fadeUp 0.3s ease; }
                .msg-pill.success { background: #00f5d4; color: #000; }
                .msg-pill.error { background: #ef4444; color: white; }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

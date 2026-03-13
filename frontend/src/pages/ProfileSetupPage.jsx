import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const STEPS = ['Personal', 'Athletic Profile'];

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        // Personal
        age: '', gender: '', height: '', weight: '', wingspan: '', dominantHand: 'right',
        // Athletic
        primarySport: '', position: '',
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const validateStep = () => {
        if (step === 0 && (!form.age || !form.gender || !form.height || !form.weight || !form.wingspan))
            return 'Please fill in all personal details.';
        if (step === 1 && (!form.primarySport || !form.position))
            return 'Please complete your athletic profile.';
        return '';
    };

    const handleNext = () => {
        const err = validateStep();
        if (err) return setError(err);
        setError('');
        setStep(s => s + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validateStep();
        if (err) return setError(err);
        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', {
                ...form,
                age: Number(form.age),
                height: Number(form.height),
                weight: Number(form.weight),
                wingspan: Number(form.wingspan),
                profileComplete: true,
            });
            // Store initial weight for history
            const history = [{ weight: Number(form.weight), date: new Date().toISOString() }];
            localStorage.setItem('weight_history', JSON.stringify(history));
            localStorage.setItem('user', JSON.stringify(data.data));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboard-shell">
            {/* Progress Bar */}
            <div className="onboard-progress">
                {STEPS.map((s, i) => (
                    <div key={s} className={`prog-step ${i <= step ? 'active' : ''}`}>
                        <div className="prog-dot">{i < step ? '✓' : i + 1}</div>
                        <span>{s}</span>
                    </div>
                ))}
                <div className="prog-bar"><div className="prog-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} /></div>
            </div>

            <div className="onboard-card">
                <div className="onboard-brand">🏆 <span>ATHLETE</span></div>
                <h1>{step === 0 ? '👤 Physical Metrics' : '🏆 Athletic Profile'}</h1>
                <p className="onboard-sub">
                    {step === 0 ? 'Baseline metrics for performance analysis.' : 'Your sport and position give context to your assessments.'}
                </p>

                {error && <div className="ob-error">{error}</div>}

                {/* STEP 0: PERSONAL */}
                {step === 0 && (
                    <div className="ob-fields">
                        <div className="ob-row">
                            <div className="ob-field">
                                <label>Age (years)</label>
                                <input type="number" min="10" max="100" placeholder="28" value={form.age} onChange={e => set('age', e.target.value)} />
                            </div>
                            <div className="ob-field">
                                <label>Gender</label>
                                <div className="toggle-group">
                                    {['male', 'female', 'other'].map(g => (
                                        <button key={g} type="button" className={form.gender === g ? 'tog active' : 'tog'} onClick={() => set('gender', g)}>
                                            {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="ob-row">
                            <div className="ob-field">
                                <label>Height (cm)</label>
                                <input type="number" min="100" max="250" placeholder="175" value={form.height} onChange={e => set('height', e.target.value)} />
                            </div>
                            <div className="ob-field">
                                <label>Weight (kg)</label>
                                <input type="number" min="30" max="300" placeholder="70" value={form.weight} onChange={e => set('weight', e.target.value)} />
                            </div>
                        </div>
                        <div className="ob-row">
                            <div className="ob-field">
                                <label>Wingspan (cm)</label>
                                <input type="number" min="100" max="250" placeholder="180" value={form.wingspan} onChange={e => set('wingspan', e.target.value)} />
                            </div>
                            <div className="ob-field">
                                <label>Dominant Hand</label>
                                <div className="toggle-group">
                                    {['left', 'right', 'ambidextrous'].map(g => (
                                        <button key={g} type="button" className={form.dominantHand === g ? 'tog active' : 'tog'} onClick={() => set('dominantHand', g)}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: ATHLETIC */}
                {step === 1 && (
                    <div className="ob-fields">
                        <div className="ob-field">
                            <label>Primary Sport</label>
                            <div className="card-group">
                                {[{ v: 'basketball', l: '🏀 Basketball' }, { v: 'football', l: '🏈 Football' }, { v: 'soccer', l: '⚽ Soccer' }, { v: 'tennis', l: '🎾 Tennis' }, { v: 'baseball', l: '⚾ Baseball' }, { v: 'track_and_field', l: '🏃 Track' }].map(o => (
                                    <button key={o.v} type="button" className={`ob-card compact ${form.primarySport === o.v ? 'selected' : ''}`} onClick={() => set('primarySport', o.v)}>
                                        <strong>{o.l}</strong>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="ob-field">
                            <label>Position / Specialty</label>
                            <input type="text" placeholder="e.g. Point Guard, Quarterback, Sprinter" value={form.position} onChange={e => set('position', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="ob-nav">
                    {step > 0 && (
                        <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <button type="button" className="btn btn-primary" onClick={handleNext}>Continue →</button>
                    ) : (
                        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? <span className="spinner" /> : '🚀 Start My Journey'}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                * { box-sizing: border-box; }
                .onboard-shell { min-height: 100vh; background: #0a0d1a; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; font-family: 'Inter', sans-serif; }
                
                .onboard-progress { display: flex; align-items: center; gap: 0; margin-bottom: 40px; position: relative; width: 360px; justify-content: space-between; }
                .prog-bar { position: absolute; top: 14px; left: 24px; right: 24px; height: 2px; background: rgba(255,255,255,0.08); z-index: 0; }
                .prog-fill { height: 100%; background: linear-gradient(90deg, #00f5d4, #7c3aed); transition: width 0.5s ease; }
                .prog-step { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; }
                .prog-dot { width: 28px; height: 28px; border-radius: 50%; background: #1a1f36; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #555; transition: all 0.3s; }
                .prog-step.active .prog-dot { background: #00f5d4; border-color: #00f5d4; color: #000; }
                .prog-step span { font-size: 11px; color: #555; }
                .prog-step.active span { color: #00f5d4; }

                .onboard-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 48px; width: 100%; max-width: 680px; backdrop-filter: blur(20px); }
                .onboard-brand { font-size: 13px; font-weight: 800; color: #00f5d4; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; }
                .onboard-brand span { margin-left: 4px; }
                .onboard-card h1 { font-size: 26px; color: white; margin-bottom: 8px; }
                .onboard-sub { color: #888; font-size: 14px; margin-bottom: 32px; }

                .ob-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; padding: 12px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; }

                .ob-fields { display: flex; flex-direction: column; gap: 24px; }
                .ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .ob-field { display: flex; flex-direction: column; gap: 8px; }
                .ob-field label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
                .ob-field input { padding: 12px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; border-radius: 10px; font-size: 15px; transition: border-color 0.2s; width: 100%; }
                .ob-field input:focus { outline: none; border-color: #00f5d4; }
                .ob-field input::placeholder { color: #555; }

                .toggle-group { display: flex; gap: 8px; flex-wrap: wrap; }
                .tog { padding: 8px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #999; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; white-space: nowrap; }
                .tog.active { background: rgba(0,245,212,0.12); border-color: #00f5d4; color: #00f5d4; font-weight: bold; }

                .card-group { display: flex; gap: 10px; flex-wrap: wrap; }
                .ob-card { padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; cursor: pointer; text-align: left; color: white; transition: all 0.2s; display: flex; flex-direction: column; gap: 4px; min-width: 160px; flex: 1; }
                .ob-card.compact { min-width: 120px; }
                .ob-card:hover { border-color: rgba(0,245,212,0.3); background: rgba(255,255,255,0.05); }
                .ob-card.selected { border-color: #00f5d4; background: rgba(0,245,212,0.08); }
                .ob-card strong { font-size: 14px; }
                .ob-card span { font-size: 11px; color: #888; }

                .bmi-preview { margin-top: 4px; padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: bold; color: white; }
                .bmi-normal { background: rgba(0,245,212,0.1); border: 1px solid rgba(0,245,212,0.2); }
                .bmi-underweight { background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.2); }
                .bmi-overweight, .bmi-obese { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
                .bmi-cat { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }

                .ob-nav { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
                .btn { padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
                .btn-primary { background: linear-gradient(135deg, #00f5d4, #7c3aed); color: white; }
                .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-ghost { background: transparent; color: #888; border: 1px solid rgba(255,255,255,0.1); }
                .btn-ghost:hover { color: white; border-color: rgba(255,255,255,0.2); }
                .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

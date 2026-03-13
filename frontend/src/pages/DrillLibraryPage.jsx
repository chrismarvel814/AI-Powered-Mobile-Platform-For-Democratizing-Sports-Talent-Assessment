import Navbar from '../components/Navbar';
import { getDrills } from '../utils/drillLibrary';
import { useNavigate } from 'react-router-dom';

export default function DrillLibraryPage() {
    const navigate = useNavigate();
    const drills = getDrills();

    return (
        <div className="page-shell">
            <Navbar />
            <main className="drill-library">
                <div className="library-header">
                    <h1>📚 Standardized Combines & Drills</h1>
                    <p>Review the protocol and tracking metrics for our official sports combine assessments.</p>
                </div>

                <div className="drills-grid">
                    {drills.map(drill => (
                        <div key={drill.id} className="drill-card">
                            <div className="drill-icon">{drill.icon}</div>
                            <div className="drill-content">
                                <h3>{drill.label}</h3>
                                <p className="drill-desc">{drill.description}</p>
                                <div className="drill-meta">
                                    <span className="track-badge">🎯 {drill.trackLabel}</span>
                                </div>
                                <button
                                    className="btn btn-outline btn-start"
                                    onClick={() => navigate('/assessment', { state: { preselect: drill.id } })}
                                >
                                    Start Assessment →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    .drill-library { padding: 40px; max-width: 1200px; margin: 0 auto; color: white; }
                    .library-header { margin-bottom: 40px; text-align: center; }
                    .library-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 10px; }
                    .library-header p { color: #888; font-size: 15px; }
                    .drills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                    .drill-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s; }
                    .drill-card:hover { transform: translateY(-4px); border-color: rgba(0, 245, 255, 0.3); }
                    .drill-icon { font-size: 40px; width: 60px; height: 60px; background: rgba(0, 245, 255, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
                    .drill-content { display: flex; flex-direction: column; flex: 1; gap: 12px; }
                    .drill-desc { color: #ccc; font-size: 14px; line-height: 1.5; flex: 1; }
                    .drill-meta { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                    .track-badge { display: inline-block; padding: 6px 12px; background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); color: #a78bfa; border-radius: 8px; font-size: 12px; font-weight: 600; }
                    .btn-start { margin-top: 16px; width: 100%; justify-content: center; }
                `}</style>
            </main>
        </div>
    );
}

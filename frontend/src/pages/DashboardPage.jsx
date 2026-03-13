import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api/axios';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SPORT_LABELS = { basketball: 'Basketball', football: 'Football', soccer: 'Soccer', tennis: 'Tennis', baseball: 'Baseball', track_and_field: 'Track & Field', other: 'Other' };

export default function DashboardPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [s, c] = await Promise.all([
                    api.get('/progress/summary'),
                    api.get('/progress/charts')
                ]);
                setSummary(s.data.data);
                setCharts(c.data.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const scoreChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Talent Score',
                data: charts?.talentScoreTrend || [],
                borderColor: '#00f5ff',
                backgroundColor: 'rgba(0, 245, 255, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff4d6d',
                pointRadius: 5,
            },
        ],
    };

    const velocityChartData = {
        labels: charts?.dates || [],
        datasets: [
            {
                label: 'Max Velocity Output',
                data: charts?.velocityTrend || [],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#f59e0b',
                pointRadius: 5,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#e2e8f0' } },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#00f5ff', bodyColor: '#e2e8f0' },
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
    };

    if (loading) {
        return (
            <div className="page-shell">
                <Navbar />
                <div className="loading-screen"><div className="pulse-loader" /><p>Loading talent metrics…</p></div>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <Navbar />
            <main className="dashboard">
                {/* Header */}
                <div className="dashboard-header" style={{ marginBottom: '30px' }}>
                    <div>
                        <h1>Athlete Overview, {user.name?.split(' ')[0]} 👋</h1>
                        <p className="subtitle" style={{ color: '#a78bfa' }}>
                            {SPORT_LABELS[user.primarySport] || user.primarySport}{user.position ? ` · ${user.position}` : ''}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/drills')}>
                        📚 View Combine Library
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-value">{summary?.totalAssessments ?? 0}</div>
                        <div className="stat-label">Total Combines</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">{summary?.averageTalentScore ?? 0}</div>
                        <div className="stat-label">Avg Talent Score</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{summary?.bestTalentScore ?? 0}</div>
                        <div className="stat-label">Max Score</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚡</div>
                        <div className="stat-value">{summary?.bestVelocity ?? 0}</div>
                        <div className="stat-label">Peak Velocity</div>
                    </div>
                </div>

                {/* Biomechanics Warning */}
                <div style={{ padding: '16px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '12px', margin: '24px 0' }}>
                    <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>
                        <strong>Note on Biomechanics Tracking:</strong> True absolute spatial distance (like stride length or literal height tracking) cannot be captured objectively through a 2D web camera without advanced depth sensors. Our system utilizes robust normalized velocity displacement metrics as a proxy mechanism to accurately measure dynamic explosion and agility performance over time.
                    </p>
                </div>

                {/* Charts */}
                {charts?.dates?.length > 0 ? (
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>🥇 Talent Score Progression</h3>
                            <Line data={scoreChartData} options={chartOptions} />
                        </div>
                        <div className="chart-card">
                            <h3>⚡ Output Velocity Trend</h3>
                            <Line data={velocityChartData} options={chartOptions} />
                        </div>
                    </div>
                ) : (
                    <div className="empty-charts">
                        <p>📊 No combine data yet. Start a drill via the library to capture baseline athletic metrics.</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions" style={{ marginTop: '40px' }}>
                    <button className="quick-btn" onClick={() => navigate('/drills')}>🏃 Start Combine Drill</button>
                    <button className="quick-btn" onClick={() => navigate('/profile')}>👤 View Athletic Profile</button>
                </div>
            </main>
        </div>
    );
}

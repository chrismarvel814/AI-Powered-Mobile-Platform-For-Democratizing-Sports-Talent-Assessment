import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <span className="brand-icon">🏋️</span>
                <span className="brand-name">Sports Talent Assessment</span>
            </div>

            <div className="nav-links">
                <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
                <Link to="/assessment" className={isActive('/assessment')}>🏃 Assessments</Link>
                <Link to="/drills" className={isActive('/drills')}>📚 Drill Library</Link>
                <Link to="/profile" className={isActive('/profile')}>👤 Profile</Link>
            </div>

            <div className="nav-user">
                <button
                    className="btn btn-ghost"
                    onClick={toggleTheme}
                    style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <span className="nav-username">👤 {user.name?.split(' ')[0] || 'User'}</span>
                <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}

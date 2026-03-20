import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed, HiOutlineUser, HiOutlineCamera } from 'react-icons/hi';
import './Auth.css';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Admin login successful!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page page-enter">
            {/* Background Orbs */}
            <div className="auth-bg-orb auth-bg-orb-1"></div>
            <div className="auth-bg-orb auth-bg-orb-2"></div>

            <div className="auth-container">
                <div className="auth-card glass-strong">
                    <div className="auth-logo">
                        <HiOutlineCamera />
                    </div>
                    <div className="auth-header">
                        <h1 className="auth-title">Admin <span className="text-gradient">Login</span></h1>
                        <p className="auth-subtitle">Elevated access for MomentPick management.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <HiOutlineUser className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder=" "
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                                <label className="floating-label">Username</label>
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <HiOutlineLockClosed className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <label className="floating-label">Password</label>
                            </div>
                        </div>

                        <button type="submit" className="btn auth-submit btn-primary" disabled={loading}>
                            {loading ? <div className="spinner spinner-sm"></div> : 'Login to Dashboard'}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        Authorized Access Only
                    </p>
                </div>
            </div>
        </div>
    );
}

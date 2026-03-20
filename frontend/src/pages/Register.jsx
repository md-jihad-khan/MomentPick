import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineCamera } from 'react-icons/hi';
import './Auth.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error('Passwords do not match.');
        }

        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters.');
        }

        setLoading(true);

        try {
            const res = await api.post('/auth/register', { name, email, password });
            login(res.data.token, res.data.user);
            toast.success('Account created! Welcome to MomentPick!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page page-enter">
            <div className="auth-bg-orb auth-bg-orb-1"></div>
            <div className="auth-bg-orb auth-bg-orb-2"></div>

            <div className="auth-container">
                <div className="auth-card glass-strong">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <HiOutlineCamera />
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join MomentPick and start sharing moments</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <HiOutlineUser className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder=" "
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    id="register-name"
                                />
                                <label className="floating-label" htmlFor="register-name">Full Name</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <HiOutlineMail className="input-icon" />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder=" "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    id="register-email"
                                />
                                <label className="floating-label" htmlFor="register-email">Email Address</label>
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
                                    id="register-password"
                                />
                                <label className="floating-label" htmlFor="register-password">Password</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <HiOutlineLockClosed className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder=" "
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    id="register-confirm-password"
                                />
                                <label className="floating-label" htmlFor="register-confirm-password">Confirm Password</label>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="register-submit">
                            {loading ? <div className="spinner spinner-sm"></div> : 'Create Account'}
                        </button>
                    </form>


                    <p className="auth-footer-text">
                        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

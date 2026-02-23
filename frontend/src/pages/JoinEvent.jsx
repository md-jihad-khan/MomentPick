import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineLockClosed } from 'react-icons/hi';
import './Auth.css';

export default function JoinEvent() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();

    const [code, setCode] = useState(inviteCode || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (inviteCode) {
            setCode(inviteCode.toUpperCase());
        }
    }, [inviteCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code || !password) return;

        setLoading(true);

        try {
            const res = await api.post('/events/join', {
                invite_code: code,
                password,
            });
            toast.success(res.data.message);
            // Navigate to the event page
            navigate(`/event/${res.data.event.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to join event.');
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
                        <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1)' }}>
                            <HiOutlineKey />
                        </div>
                        <h1 className="auth-title">Join Event</h1>
                        <p className="auth-subtitle">Enter the invite code and password to access the event's photos</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Invite Code</label>
                            <div className="input-icon-wrapper">
                                <HiOutlineKey className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input form-input-icon"
                                    placeholder="e.g. A1B2C3D4"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    required
                                    id="join-invite-code"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Event Password</label>
                            <div className="input-icon-wrapper">
                                <HiOutlineLockClosed className="input-icon" />
                                <input
                                    type="password"
                                    className="form-input form-input-icon"
                                    placeholder="Enter event password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    id="join-event-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="join-submit">
                            {loading ? <div className="spinner spinner-sm"></div> : 'Join Event'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

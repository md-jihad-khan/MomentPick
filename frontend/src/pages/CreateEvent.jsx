import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineLockClosed, HiOutlinePencil, HiOutlineInformationCircle } from 'react-icons/hi';
import './Auth.css'; // Re-use the premium auth styles
import './CreateEvent.css';

export default function CreateEvent() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error('Passwords do not match.');
        }

        if (password.length < 4) {
            return toast.error('Password must be at least 4 characters.');
        }

        setLoading(true);

        try {
            const res = await api.post('/events', { name, description, password });
            
            // Save to localStorage
            const joinedIds = JSON.parse(localStorage.getItem('joined_events') || '[]');
            if (!joinedIds.includes(res.data.event.id)) {
                joinedIds.push(res.data.event.id);
                localStorage.setItem('joined_events', JSON.stringify(joinedIds));
            }

            toast.success('Event created! Share the invite code with your friends.');
            navigate(`/event/${res.data.event.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create event.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-event-page page-enter">
            <div className="container">
                <div className="create-event-container">
                    <div className="create-event-card glass-strong">
                        <div className="create-event-header">
                            <div className="create-event-icon">
                                <HiOutlineCalendar />
                            </div>
                            <h1 className="create-event-title">Create New <span className="text-gradient">Event</span></h1>
                            <p className="create-event-subtitle">
                                Set up a safe, private photo-sharing event for your group.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form create-event-form">
                            <div className="form-group">
                                <div className="input-icon-wrapper">
                                    <HiOutlinePencil className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder=" "
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        id="event-name-input"
                                    />
                                    <label className="floating-label">Event Name</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="input-icon-wrapper">
                                    <textarea
                                        className="form-input"
                                        placeholder=" "
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        id="event-description-input"
                                        style={{ height: 'auto', paddingTop: '36px', paddingBottom: '16px' }}
                                    />
                                    <label className="floating-label" style={{ top: '12px', transform: 'none' }}>Description (optional)</label>
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
                                        id="event-password-input"
                                        autoComplete="new-password"
                                    />
                                    <label className="floating-label">Event Password</label>
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
                                        id="event-confirm-password-input"
                                        autoComplete="new-password"
                                    />
                                    <label className="floating-label">Confirm Password</label>
                                </div>
                            </div>

                            <div className="create-event-info">
                                <HiOutlineInformationCircle />
                                <p>Invite friends using the code and password generated after creation. They can contribute unlimited photos!</p>
                            </div>

                            <button type="submit" className="btn auth-submit btn-primary btn-lg create-event-submit" disabled={loading} id="create-event-submit">
                                {loading ? <div className="spinner spinner-sm"></div> : 'Launch Event'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

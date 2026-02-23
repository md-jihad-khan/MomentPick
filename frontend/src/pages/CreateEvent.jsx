import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineLockClosed, HiOutlinePencil, HiOutlineInformationCircle } from 'react-icons/hi';
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
                            <h1 className="create-event-title">Create New Event</h1>
                            <p className="create-event-subtitle">
                                Set up a photo-sharing event for your group. The event will expire in 7 days.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="create-event-form">
                            <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <div className="input-icon-wrapper">
                                    <HiOutlinePencil className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input form-input-icon"
                                        placeholder="e.g. Beach Trip 2026"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        id="event-name-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (optional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="What's this event about?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    id="event-description-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Event Password</label>
                                <div className="input-icon-wrapper">
                                    <HiOutlineLockClosed className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input form-input-icon"
                                        placeholder="Password to join this event"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        id="event-password-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-icon-wrapper">
                                    <HiOutlineLockClosed className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input form-input-icon"
                                        placeholder="Repeat event password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        id="event-confirm-password-input"
                                    />
                                </div>
                            </div>

                            <div className="create-event-info">
                                <HiOutlineInformationCircle />
                                <p>Share the invite code and password with your friends so they can join and contribute photos.</p>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg create-event-submit" disabled={loading} id="create-event-submit">
                                {loading ? <div className="spinner spinner-sm"></div> : 'Create Event'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

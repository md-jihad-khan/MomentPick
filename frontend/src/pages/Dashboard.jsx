import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePhotograph, HiOutlineUserGroup, HiOutlineClock, HiOutlineLink, HiOutlineKey } from 'react-icons/hi';
import './Dashboard.css';

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joining, setJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data.events);
        } catch (err) {
            toast.error('Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode || !joinPassword) return;
        setJoining(true);

        try {
            const res = await api.post('/events/join', {
                invite_code: joinCode,
                password: joinPassword,
            });
            toast.success(res.data.message);
            setShowJoinModal(false);
            setJoinCode('');
            setJoinPassword('');
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to join event.');
        } finally {
            setJoining(false);
        }
    };

    const getTimeRemaining = (expiresAt) => {
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ paddingTop: '120px' }}>
                <div className="spinner"></div>
                <p className="loading-text">Loading your events...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page page-enter">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            Welcome, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
                        </h1>
                        <p className="dashboard-subtitle">
                            {events.length === 0
                                ? 'Create or join an event to get started!'
                                : `You have ${events.length} active event${events.length > 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        <button onClick={() => setShowJoinModal(true)} className="btn btn-secondary" id="dashboard-join-btn">
                            <HiOutlineLink />
                            Join Event
                        </button>
                        <Link to="/create-event" className="btn btn-primary" id="dashboard-create-btn">
                            <HiOutlinePlus />
                            Create Event
                        </Link>
                    </div>
                </div>

                {events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <HiOutlinePhotograph />
                        </div>
                        <h2>No Events Yet</h2>
                        <p>Create a new event to start sharing photos with your friends, or join an existing one.</p>
                        <div className="empty-state-actions">
                            <Link to="/create-event" className="btn btn-primary" id="empty-create-btn">
                                <HiOutlinePlus />
                                Create Your First Event
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map((event, index) => (
                            <Link
                                to={`/event/${event.id}`}
                                key={event.id}
                                className="event-card card"
                                style={{ animationDelay: `${index * 0.08}s` }}
                                id={`event-card-${event.id}`}
                            >
                                <div className="event-card-header">
                                    <h3 className="event-card-title">{event.name}</h3>
                                    {event.is_creator && <span className="event-badge event-badge-creator">Creator</span>}
                                </div>

                                {event.description && (
                                    <p className="event-card-desc">{event.description}</p>
                                )}

                                <div className="event-card-meta">
                                    <div className="event-meta-item">
                                        <HiOutlinePhotograph />
                                        <span>{event.photo_count} photos</span>
                                    </div>
                                    <div className="event-meta-item">
                                        <HiOutlineUserGroup />
                                        <span>{event.participant_count} members</span>
                                    </div>
                                    <div className="event-meta-item event-meta-time">
                                        <HiOutlineClock />
                                        <span>{getTimeRemaining(event.expires_at)}</span>
                                    </div>
                                </div>

                                <div className="event-card-footer">
                                    <span className="event-card-code">
                                        Code: <strong>{event.invite_code}</strong>
                                    </span>
                                    <span className="event-card-creator-name">
                                        by {event.is_creator ? 'You' : event.creator_name}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Join Modal */}
            {showJoinModal && (
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Join an Event</h2>
                        <p className="modal-desc">Enter the invite code and event password to join.</p>

                        <form onSubmit={handleJoin}>
                            <div className="form-group">
                                <label className="form-label">Invite Code</label>
                                <div className="input-icon-wrapper">
                                    <HiOutlineLink className="input-icon" />
                                    <input
                                        type="text"
                                        className="form-input form-input-icon"
                                        placeholder="e.g. A1B2C3D4"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        required
                                        id="join-code-input"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Event Password</label>
                                <div className="input-icon-wrapper">
                                    <HiOutlineKey className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input form-input-icon"
                                        placeholder="Enter event password"
                                        value={joinPassword}
                                        onChange={(e) => setJoinPassword(e.target.value)}
                                        required
                                        id="join-password-input"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={joining} id="join-submit-btn">
                                    {joining ? <div className="spinner spinner-sm"></div> : 'Join Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

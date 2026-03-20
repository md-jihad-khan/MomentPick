import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePhotograph, HiOutlineUserGroup, HiOutlineClock, HiOutlineLink, HiOutlineKey, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joining, setJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllEvents();
    }, []);

    const fetchAllEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events?all=true');
            setEvents(res.data.events);
        } catch (err) {
            toast.error('Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (e, eventId) => {
        e.stopPropagation();
        if (!window.confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${eventId}`);
            toast.success('Event deleted.');
            fetchAllEvents();
        } catch (err) {
            toast.error('Failed to delete event.');
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
            
            // Save to localStorage for user tracking
            const joinedIds = JSON.parse(localStorage.getItem('joined_events') || '[]');
            if (!joinedIds.includes(res.data.event.id)) {
                joinedIds.push(res.data.event.id);
                localStorage.setItem('joined_events', JSON.stringify(joinedIds));
            }

            toast.success(res.data.message);
            setShowJoinModal(false);
            setJoinCode('');
            setJoinPassword('');
            navigate(`/event/${res.data.event.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to join event.');
        } finally {
            setJoining(false);
        }
    };

    const handleEventClick = (event) => {
        const joinedIds = JSON.parse(localStorage.getItem('joined_events') || '[]');
        if (isAdmin || joinedIds.includes(event.id)) {
            navigate(`/event/${event.id}`);
        } else {
            setJoinCode(event.invite_code);
            setShowJoinModal(true);
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ paddingTop: '120px' }}>
                <div className="spinner"></div>
                <p className="loading-text">Loading events...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page page-enter">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">
                            {isAdmin ? 'Manage' : 'Discover'} <span className="text-gradient">Events</span>
                        </h1>
                        <p className="dashboard-subtitle">
                            {isAdmin 
                                ? 'Control and manage all active events in the system.' 
                                : 'Explore public events and join them using a password.'}
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        {isAdmin && (
                            <Link to="/create-event" className="btn btn-primary" id="dashboard-create-btn">
                                <HiOutlinePlus />
                                Create Event
                            </Link>
                        )}
                    </div>
                </div>

                {events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <HiOutlinePhotograph />
                        </div>
                        <h2>No Events Found</h2>
                        <p>There are no active {isAdmin ? '' : 'public'} events at the moment.</p>
                        {isAdmin && (
                            <Link to="/create-event" className="btn btn-primary">
                                Create Your First Event
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="events-grid">
                        {events.map((event, index) => (
                            <div
                                key={event.id}
                                className="event-card card"
                                style={{ animationDelay: `${index * 0.08}s` }}
                                onClick={() => handleEventClick(event)}
                                id={`event-card-${event.id}`}
                            >
                                <div className="event-card-header">
                                    <h3 className="event-card-title">{event.name}</h3>
                                    {isAdmin && <span className="event-badge event-badge-admin">Admin View</span>}
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
                                </div>

                                <div className="event-card-footer">
                                    <span className="event-card-code">
                                        Code: <strong>{event.invite_code}</strong>
                                    </span>
                                    <div className="card-actions-inline">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => handleDeleteEvent(e, event.id)}
                                                className="photo-action-btn photo-action-delete"
                                                title="Delete Event"
                                                id={`delete-card-${event.id}`}
                                            >
                                                <HiOutlineTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Join Modal */}
            {showJoinModal && (
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Join Event</h2>
                        <p className="modal-desc">Enter the event password to access.</p>

                        <form onSubmit={handleJoin}>
                            <div className="form-group">
                                <label className="form-label">Invite Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. A1B2C3D4"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    required
                                    id="join-code-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Event Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter event password"
                                    value={joinPassword}
                                    onChange={(e) => setJoinPassword(e.target.value)}
                                    required
                                    id="join-password-input"
                                />
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

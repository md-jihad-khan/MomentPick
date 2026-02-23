import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    HiOutlineUpload, HiOutlineDownload, HiOutlineTrash, HiOutlineUserGroup,
    HiOutlineClock, HiOutlineClipboardCopy, HiOutlinePhotograph,
    HiOutlineX, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineShare
} from 'react-icons/hi';
import './EventDetail.css';

export default function EventDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showParticipants, setShowParticipants] = useState(false);

    useEffect(() => {
        fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            const res = await api.get(`/events/${id}`);
            setEvent(res.data.event);
            setPhotos(res.data.photos);
            setParticipants(res.data.participants);
        } catch (err) {
            if (err.response?.status === 403) {
                toast.error('You do not have access to this event.');
                navigate('/dashboard');
            } else {
                toast.error('Failed to load event.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        files.forEach((file) => formData.append('photos', file));

        try {
            const res = await api.post(`/photos/upload/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(res.data.message);
            fetchEventData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (photo) => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = photo.file_name || 'photo.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Download started!');
        } catch (err) {
            toast.error('Failed to download photo.');
        }
    };

    const handleBulkDownload = async () => {
        if (selectedPhotos.length === 0) {
            return toast.error('Select photos to download.');
        }

        for (const photoId of selectedPhotos) {
            const photo = photos.find(p => p.id === photoId);
            if (photo) await handleDownload(photo);
        }
        setSelectedPhotos([]);
    };

    const togglePhotoSelect = (photoId) => {
        setSelectedPhotos(prev =>
            prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
        );
    };

    const selectAll = () => {
        if (selectedPhotos.length === photos.length) {
            setSelectedPhotos([]);
        } else {
            setSelectedPhotos(photos.map(p => p.id));
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm('Delete this photo?')) return;

        try {
            await api.delete(`/photos/${photoId}`);
            toast.success('Photo deleted.');
            fetchEventData();
            if (lightboxPhoto?.id === photoId) setLightboxPhoto(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete photo.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm('Delete this entire event and all photos? This cannot be undone.')) return;

        try {
            await api.delete(`/events/${id}`);
            toast.success('Event deleted.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to delete event.');
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${event.invite_code}`;
        navigator.clipboard.writeText(link);
        toast.success('Invite link copied!');
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(event.invite_code);
        toast.success('Invite code copied!');
    };

    const openLightbox = (photo, index) => {
        setLightboxPhoto(photo);
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxPhoto(null);
    };

    const navigateLightbox = (dir) => {
        const newIndex = lightboxIndex + dir;
        if (newIndex >= 0 && newIndex < photos.length) {
            setLightboxIndex(newIndex);
            setLightboxPhoto(photos[newIndex]);
        }
    };

    const getTimeRemaining = (expiresAt) => {
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ paddingTop: '120px' }}>
                <div className="spinner"></div>
                <p className="loading-text">Loading event...</p>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="event-detail-page page-enter">
            <div className="container">
                {/* Event Header */}
                <div className="event-detail-header">
                    <div className="event-detail-info">
                        <h1 className="event-detail-title">{event.name}</h1>
                        {event.description && (
                            <p className="event-detail-desc">{event.description}</p>
                        )}
                        <div className="event-detail-meta">
                            <span className="event-detail-meta-item">
                                <HiOutlineUserGroup />
                                {participants.length} member{participants.length !== 1 ? 's' : ''}
                            </span>
                            <span className="event-detail-meta-item">
                                <HiOutlinePhotograph />
                                {photos.length} photo{photos.length !== 1 ? 's' : ''}
                            </span>
                            <span className="event-detail-meta-item event-detail-timer">
                                <HiOutlineClock />
                                {getTimeRemaining(event.expires_at)}
                            </span>
                            <span className="event-detail-meta-item event-detail-creator">
                                by {event.is_creator ? 'You' : event.creator_name}
                            </span>
                        </div>
                    </div>

                    <div className="event-detail-actions">
                        <button onClick={() => setShowParticipants(!showParticipants)} className="btn btn-secondary btn-sm" id="toggle-participants">
                            <HiOutlineUserGroup />
                            Members
                        </button>
                        <button onClick={copyInviteCode} className="btn btn-secondary btn-sm" id="copy-invite-code">
                            <HiOutlineClipboardCopy />
                            Code: {event.invite_code}
                        </button>
                        <button onClick={copyInviteLink} className="btn btn-secondary btn-sm" id="copy-invite-link">
                            <HiOutlineShare />
                            Share Link
                        </button>
                        {event.is_creator && (
                            <button onClick={handleDeleteEvent} className="btn btn-danger btn-sm" id="delete-event-btn">
                                <HiOutlineTrash />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Participants Panel */}
                {showParticipants && (
                    <div className="participants-panel glass animate-fade-in">
                        <h3 className="participants-title">Members ({participants.length})</h3>
                        <div className="participants-list">
                            {participants.map((p) => (
                                <div key={p.id} className="participant-item">
                                    <div className="participant-avatar">
                                        {p.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <span className="participant-name">{p.name}</span>
                                        <span className="participant-email">{p.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <div className="upload-section glass">
                    <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                        {uploading ? (
                            <>
                                <div className="spinner"></div>
                                <p>Uploading photos...</p>
                            </>
                        ) : (
                            <>
                                <HiOutlineUpload className="upload-icon" />
                                <p className="upload-text">Click to upload photos</p>
                                <p className="upload-hint">JPEG, PNG, WebP, GIF, HEIC — up to 15MB each, max 20 at a time</p>
                            </>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                        id="photo-upload-input"
                    />
                </div>

                {/* Selection toolbar */}
                {photos.length > 0 && (
                    <div className="gallery-toolbar">
                        <div className="gallery-toolbar-left">
                            <button onClick={selectAll} className="btn btn-secondary btn-sm" id="select-all-btn">
                                {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
                            </button>
                            {selectedPhotos.length > 0 && (
                                <span className="selection-count">{selectedPhotos.length} selected</span>
                            )}
                        </div>
                        {selectedPhotos.length > 0 && (
                            <button onClick={handleBulkDownload} className="btn btn-primary btn-sm" id="bulk-download-btn">
                                <HiOutlineDownload />
                                Download Selected ({selectedPhotos.length})
                            </button>
                        )}
                    </div>
                )}

                {/* Photo Gallery */}
                {photos.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 20px' }}>
                        <div className="empty-state-icon">
                            <HiOutlinePhotograph />
                        </div>
                        <h2>No Photos Yet</h2>
                        <p>Be the first to upload photos to this event!</p>
                    </div>
                ) : (
                    <div className="photo-gallery">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                className={`photo-card ${selectedPhotos.includes(photo.id) ? 'photo-card-selected' : ''}`}
                                style={{ animationDelay: `${Math.min(index * 0.05, 1)}s` }}
                            >
                                <div className="photo-select" onClick={() => togglePhotoSelect(photo.id)}>
                                    <div className={`photo-checkbox ${selectedPhotos.includes(photo.id) ? 'photo-checkbox-checked' : ''}`}>
                                        {selectedPhotos.includes(photo.id) && '✓'}
                                    </div>
                                </div>

                                <div className="photo-image-wrapper" onClick={() => openLightbox(photo, index)}>
                                    <img src={photo.url} alt={photo.file_name} className="photo-image" loading="lazy" />
                                    <div className="photo-overlay">
                                        <span>View</span>
                                    </div>
                                </div>

                                <div className="photo-info">
                                    <span className="photo-uploader">{photo.uploader_name}</span>
                                    <div className="photo-actions-inline">
                                        <button onClick={() => handleDownload(photo)} className="photo-action-btn" title="Download">
                                            <HiOutlineDownload />
                                        </button>
                                        {(photo.uploader_id === user?.id || event.is_creator) && (
                                            <button onClick={() => handleDeletePhoto(photo.id)} className="photo-action-btn photo-action-delete" title="Delete">
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

            {/* Lightbox */}
            {lightboxPhoto && (
                <div className="lightbox" onClick={closeLightbox}>
                    <button className="lightbox-close" onClick={closeLightbox} id="lightbox-close">
                        <HiOutlineX />
                    </button>

                    {lightboxIndex > 0 && (
                        <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }} id="lightbox-prev">
                            <HiOutlineChevronLeft />
                        </button>
                    )}

                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxPhoto.url} alt={lightboxPhoto.file_name} className="lightbox-image" />
                        <div className="lightbox-info">
                            <span>Uploaded by {lightboxPhoto.uploader_name}</span>
                            <div className="lightbox-actions">
                                <button onClick={() => handleDownload(lightboxPhoto)} className="btn btn-primary btn-sm" id="lightbox-download">
                                    <HiOutlineDownload />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>

                    {lightboxIndex < photos.length - 1 && (
                        <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }} id="lightbox-next">
                            <HiOutlineChevronRight />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

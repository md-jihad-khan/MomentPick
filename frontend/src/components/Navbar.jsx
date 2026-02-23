import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCamera, HiOutlineLogout, HiOutlinePlus, HiOutlineViewGrid } from 'react-icons/hi';
import './Navbar.css';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <Link to="/" className="navbar-brand" id="navbar-brand">
                    <HiOutlineCamera className="navbar-icon" />
                    <span className="navbar-logo-text">Moment<span className="navbar-logo-accent">Pick</span></span>
                </Link>

                <div className="navbar-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="navbar-link" id="nav-dashboard">
                                <HiOutlineViewGrid />
                                <span>My Events</span>
                            </Link>
                            <Link to="/create-event" className="navbar-link navbar-link-create" id="nav-create-event">
                                <HiOutlinePlus />
                                <span>Create</span>
                            </Link>
                            <div className="navbar-user">
                                <div className="navbar-avatar">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="navbar-user-name">{user?.name?.split(' ')[0]}</span>
                            </div>
                            <button onClick={handleLogout} className="navbar-link navbar-logout-btn" id="nav-logout">
                                <HiOutlineLogout />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="navbar-link" id="nav-login">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

import { Link } from 'react-router-dom';
import { HiOutlineCamera, HiOutlinePlus, HiOutlineViewGrid, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { isAdmin, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <Link to="/" className="navbar-brand" id="navbar-brand">
                    <HiOutlineCamera className="navbar-icon" />
                    <span className="navbar-logo-text">Moment<span className="navbar-logo-accent">Pick</span></span>
                </Link>

                <div className="navbar-links">
                    <Link to="/dashboard" className="navbar-link" id="nav-dashboard">
                        <HiOutlineViewGrid />
                        <span>Events</span>
                    </Link>
                    
                    {isAdmin ? (
                        <>
                            <Link to="/create-event" className="navbar-link navbar-link-create" id="nav-create-event">
                                <HiOutlinePlus />
                                <span>Create</span>
                            </Link>
                            <button onClick={logout} className="navbar-link btn-logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                                <HiOutlineLogout />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/admin-login" className="navbar-link" id="nav-login">
                            <HiOutlineUser />
                            <span>Admin</span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

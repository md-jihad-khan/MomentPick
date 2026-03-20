import { Link } from 'react-router-dom';
import { HiOutlineCamera, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineDownload, HiOutlineClock, HiOutlineSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const { isAdmin } = useAuth();

    return (
        <div className="home-page page-enter">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg-orb hero-bg-orb-1"></div>
                <div className="hero-bg-orb hero-bg-orb-2"></div>
                <div className="hero-bg-orb hero-bg-orb-3"></div>

                <div className="container hero-content">
                    <div className="hero-badge">
                        <HiOutlineSparkles />
                        <span>The simplest way to share group photos</span>
                    </div>

                    <h1 className="hero-title">
                        Every Moment,<br />
                        <span className="hero-title-gradient">Shared Instantly</span>
                    </h1>

                    <p className="hero-subtitle">
                        Stop sending photos one by one. Create a private event, invite your friends,
                        and let everyone upload & pick their favorite shots — all in one place.
                    </p>

                    <div className="hero-actions">
                        {isAdmin && (
                            <Link to="/create-event" className="btn btn-primary btn-lg" id="hero-create-btn">
                                Create Event
                            </Link>
                        )}
                        <Link to="/dashboard" className={`btn ${isAdmin ? 'btn-secondary' : 'btn-primary'} btn-lg`} id="hero-dashboard-btn">
                            Explore Events
                        </Link>
                        <Link to="/join" className="btn btn-secondary btn-lg" id="hero-join-btn">
                            Join Event
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">100%</span>
                            <span className="hero-stat-label">Private & Secure</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">Pure</span>
                            <span className="hero-stat-label">Privacy</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat">
                            <span className="hero-stat-number">∞</span>
                            <span className="hero-stat-label">Photos Per Event</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">
                        How It <span className="text-gradient">Works</span>
                    </h2>
                    <p className="section-subtitle">
                        Three simple steps to share every moment with your crew
                    </p>

                    <div className="steps-grid">
                        <div className="step-card" style={{ animationDelay: '0.1s' }}>
                            <div className="step-number">01</div>
                            <div className="step-icon-wrapper">
                                <HiOutlineCamera className="step-icon" />
                            </div>
                            <h3 className="step-title">Create an Event</h3>
                            <p className="step-desc">
                                Set a name and password for your event. Share the invite link with your group.
                            </p>
                        </div>

                        <div className="step-card" style={{ animationDelay: '0.2s' }}>
                            <div className="step-number">02</div>
                            <div className="step-icon-wrapper step-icon-pink">
                                <HiOutlineUserGroup className="step-icon" />
                            </div>
                            <h3 className="step-title">Friends Join In</h3>
                            <p className="step-desc">
                                Your friends enter the password once, and they're in — the event is saved to their dashboard for easy access.
                            </p>
                        </div>

                        <div className="step-card" style={{ animationDelay: '0.3s' }}>
                            <div className="step-number">03</div>
                            <div className="step-icon-wrapper step-icon-cyan">
                                <HiOutlineDownload className="step-icon" />
                            </div>
                            <h3 className="step-title">Upload & Pick</h3>
                            <p className="step-desc">
                                Everyone uploads their photos. Browse the gallery and download only the moments you love.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">
                        Why <span className="text-gradient">MomentPick?</span>
                    </h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <HiOutlineShieldCheck className="feature-icon" />
                            <h3>Password Protected</h3>
                            <p>Every event is locked with a password. Only invited friends can access and upload.</p>
                        </div>
                        <div className="feature-card">
                            <HiOutlineClock className="feature-icon feature-icon-pink" />
                            <h3>Safe & Simple</h3>
                            <p>Events stay active until the admin decides to close them. No random deletions.</p>
                        </div>
                        <div className="feature-card">
                            <HiOutlineDownload className="feature-icon feature-icon-cyan" />
                            <h3>Pick What You Want</h3>
                            <p>Don't want 200 photos? Browse the gallery and download only the ones you actually like.</p>
                        </div>
                        <div className="feature-card">
                            <HiOutlineUserGroup className="feature-icon feature-icon-emerald" />
                            <h3>Easy Access</h3>
                            <p>Enter the password once and the event stays on your dashboard for quick access anytime.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card glass-strong">
                        <h2 className="cta-title">
                            Ready to share your next adventure?
                        </h2>
                        <p className="cta-desc">
                            Start sharing moments with your friends today.
                        </p>
                        {isAdmin ? (
                            <Link to="/create-event" className="btn btn-primary btn-lg" id="cta-create-btn">
                                Create Your First Event
                            </Link>
                        ) : (
                            <Link to="/dashboard" className="btn btn-primary btn-lg" id="cta-explore-btn">
                                Explore Public Events
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <HiOutlineCamera className="footer-icon" />
                        <span className="footer-logo">Moment<span className="text-gradient">Pick</span></span>
                    </div>
                    <p className="footer-text">Every moment, shared instantly. © 2026</p>
                </div>
            </footer>
        </div>
    );
}

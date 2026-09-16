import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PublicNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="navbar-container">
        <div className="nav-logo">
          <Link to="/" className="nav-brand-link">
            <img src="/assets/images/logo_icon.png" alt="Agrivision Logo" className="nav-brand-icon" />
            <div className="nav-brand-text">
              <span className="brand-title">
                <span className="brand-agri">Agri</span><span className="brand-vision">vision</span>
              </span>
              <span className="brand-tagline">See &bull; Regenerate &bull; Prosper</span>
            </div>
          </Link>
        </div>
        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`} id="navMenu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/signals" className={`nav-link ${location.pathname === '/signals' ? 'active' : ''}`}>Five Signals</Link>
          <Link to="/mrv" className={`nav-link ${location.pathname === '/mrv' ? 'active' : ''}`}>End-to-End MRV</Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        </div>
        <div className="nav-right">
          <Link to="/login" className="btn-login">Log In</Link>
          <Link to="/contact" className="btn-request-demo">Request Demo</Link>
          <button className={`nav-hamburger ${isMobileMenuOpen ? 'active' : ''}`} id="navHamburger" onClick={toggleMobileMenu} aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;

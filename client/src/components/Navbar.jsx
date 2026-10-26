import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ theme, onToggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor page scroll to apply background shadow to header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate('/');
  };

  // Helper to determine if we should scroll or navigate for anchor links
  const handleAnchorClick = (e, targetId) => {
    closeMobileMenu();
    if (location.pathname !== '/') {
      // If we are not on the landing page, navigate to home with the hash
      // React Router will load the home page, and standard browser behavior will scroll if hash is in URL
      return;
    }
    
    // If on homepage, prevent default router behavior and scroll smoothly
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 72; // height of fixed navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const dashboardPath = user?.role === 'student' ? '/student/dashboard' : '/mentor/dashboard';
  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  const ThemeToggle = () => (
    <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel}>
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </span>
      <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <Link to="/" className="logo-link" onClick={closeMobileMenu}>
            <img
              src="/logo.png"
              alt="MentorConnect"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <span>MentorConnect</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            <Link to="/" className="nav-item" onClick={closeMobileMenu}>Home</Link>
            <a href="/#mentors" className="nav-item" onClick={(e) => handleAnchorClick(e, 'mentors')}>Find Mentors</a>
            <a href="/#how-it-works" className="nav-item" onClick={(e) => handleAnchorClick(e, 'how-it-works')}>How It Works</a>
            <a href="/#benefits" className="nav-item" onClick={(e) => handleAnchorClick(e, 'benefits')}>About</a>
            {isAuthenticated && (
              <Link to={dashboardPath} className="nav-item">Dashboard</Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="nav-auth">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="nav-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link to={dashboardPath} className="user-avatar-indicator" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <div className="navbar-avatar" style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--primary)'
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {user.name.split(' ')[0]}
                  </span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button className="menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Drawer Overlay */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-links">
          <Link to="/" className="mobile-nav-item" onClick={closeMobileMenu}>Home</Link>
          <a href="/#mentors" className="mobile-nav-item" onClick={(e) => handleAnchorClick(e, 'mentors')}>Find Mentors</a>
          <a href="/#how-it-works" className="mobile-nav-item" onClick={(e) => handleAnchorClick(e, 'how-it-works')}>How It Works</a>
          <a href="/#benefits" className="mobile-nav-item" onClick={(e) => handleAnchorClick(e, 'benefits')}>About</a>
          {isAuthenticated && (
            <Link to={dashboardPath} className="mobile-nav-item" onClick={closeMobileMenu}>Dashboard</Link>
          )}
        </div>
        <div className="mobile-nav-auth">
          <ThemeToggle />
          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--primary)'
                }}>
                  {getInitials(user.name)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMobileMenu}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;

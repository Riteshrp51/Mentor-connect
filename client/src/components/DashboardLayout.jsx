import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  GraduationCap,
  FileText,
} from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';
import './DashboardLayout.css';

const DashboardLayout = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isStudent = user?.role === 'student';

  const defaultNotifications = isStudent
    ? [
        { id: 1, title: 'Mentor request accepted', message: 'Dr. Sarah approved your mentorship request.', time: '2 min ago', tone: 'success', path: '/student/requests' },
        { id: 2, title: 'New session reminder', message: 'Your mock interview is scheduled for 4:00 PM today.', time: '1 hour ago', tone: 'info', path: '/student/sessions' },
        { id: 3, title: 'Profile details check', message: 'Complete your profile details to connect with top mentors.', time: 'Today', tone: 'neutral', path: '/student/dashboard' }
      ]
    : [
        { id: 1, title: 'New student request', message: 'Sneha wants guidance on full-stack optimization.', time: '5 min ago', tone: 'info', path: '/mentor/requests' },
        { id: 2, title: 'Session confirmation', message: 'Rohan confirmed the mentoring session for tomorrow.', time: '35 min ago', tone: 'success', path: '/mentor/sessions' },
        { id: 3, title: 'Weekly feedback', message: 'You have 2 pending mentee feedback reviews.', time: 'Today', tone: 'warning', path: '/mentor/sessions' }
      ];

  const [notifications, setNotifications] = useState(defaultNotifications);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Define navigation links by role
  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Browse Mentors', path: '/student/mentors', icon: <Users size={18} /> },
    { name: 'My Requests', path: '/student/requests', icon: <FileText size={18} /> },
    { name: 'Sessions', path: '/student/sessions', icon: <Calendar size={18} /> },
    { name: 'Messages', path: '/student/messages', icon: <MessageSquare size={18} /> }
  ];

  const mentorLinks = [
    { name: 'Dashboard', path: '/mentor/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Requests', path: '/mentor/requests', icon: <FileText size={18} /> },
    { name: 'Sessions', path: '/mentor/sessions', icon: <Calendar size={18} /> },
    { name: 'Messages', path: '/mentor/messages', icon: <MessageSquare size={18} /> }
  ];

  const navLinks = isStudent ? studentLinks : mentorLinks;

  // Determine current active page label for breadcrumbs
  const currentLink = navLinks.find(link => location.pathname === link.path);
  const pageTitle = currentLink ? currentLink.name : 'Dashboard';

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <NavLink to="/" className="sidebar-logo" onClick={() => setIsMobileOpen(false)}>
            <div className="sidebar-logo-icon">
              <GraduationCap size={20} strokeWidth={2.5} />
            </div>
            <span>MentorConnect</span>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link sidebar-logout-btn"
            type="button"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle sidebar"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-breadcrumb">
              <span>MentorConnect</span>
              <span>/</span>
              <span className="breadcrumb-active">{pageTitle}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Theme Toggle */}
            <button
              className="notification-bell-btn"
              onClick={onToggleTheme}
              type="button"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="notification-wrapper">
              <button
                className="notification-bell-btn"
                aria-label="Notifications"
                title="Notifications"
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell size={18} />
                <span className="notification-badge">{notifications.length}</span>
              </button>

              {showNotifications && (
                <div className="notification-dropdown" role="menu" aria-label="Notifications panel">
                  <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Notifications</span>
                      <span className="notification-panel-count">{notifications.length}</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotifications([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '2px 6px'
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className="notification-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShowNotifications(false);
                            if (item.path) navigate(item.path);
                          }}
                        >
                          <div className={`notification-dot ${item.tone}`} />
                          <div className="notification-content">
                            <div className="notification-title">{item.title}</div>
                            <div className="notification-message">{item.message}</div>
                            <div className="notification-time">{item.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Photo / Avatar badge - Click to open settings */}
            <div
              className="sidebar-user-avatar"
              onClick={() => setIsSettingsModalOpen(true)}
              style={{
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1.5px solid var(--primary)',
                fontSize: '12px',
                transition: 'transform 0.15s ease',
                overflow: 'hidden',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={`Click to edit profile (${user?.name || 'User'})`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || 'User'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Pages Render Outlet */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;

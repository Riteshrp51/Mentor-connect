import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';
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
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const isStudent = user?.role === 'student';
  const [notifications, setNotifications] = useState([]);

  // Helper to format relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const mapNotification = (n, currentRole) => {
    let path = `/${currentRole}/dashboard`;
    let tone = 'purple';
    if (n.type === 'session_scheduled' || n.type === 'session_booked') {
      path = `/${currentRole}/sessions`;
      tone = 'emerald';
    } else if (n.type === 'new_message') {
      path = `/${currentRole}/messages`;
      tone = 'blue';
    } else if (n.type?.startsWith('request_') || n.type === 'new_request') {
      path = `/${currentRole}/requests`;
      tone = 'amber';
    }

    return {
      id: n._id,
      title: n.title,
      message: n.message,
      time: formatTimeAgo(n.createdAt),
      path,
      tone,
      isRead: !!n.isRead,
      type: n.type,
    };
  };

  // Fetch count of chats having unread messages
  const fetchUnreadSummary = async () => {
    try {
      const res = await api.get('/api/conversations/unread-summary');
      if (res.data && res.data.status === 'success') {
        setUnreadChatsCount(res.data.data.unreadChatsCount || 0);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  // Fetch real notifications from database
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      if (res.data && res.data.status === 'success') {
        const raw = res.data.data.notifications || [];
        setNotifications(raw.map((n) => mapNotification(n, user?.role || 'student')));
      }
    } catch (err) {
      // Quiet fail
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
    } catch (err) {
      setNotifications([]);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await api.patch('/api/notifications/mark-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // Quiet fail
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchUnreadSummary();
    fetchNotifications();

    const handleUpdate = () => {
      fetchUnreadSummary();
    };

    window.addEventListener('unread_counts_updated', handleUpdate);

    if (socket) {
      // Join user-specific socket room for live notifications and session updates
      socket.emit('join_user', user._id);

      socket.on('receive_message', handleUpdate);
      socket.on('conversation_updated', handleUpdate);
      socket.on('messages_read', handleUpdate);

      // Real-time live notification received
      socket.on('new_notification', (newNotif) => {
        if (!newNotif) return;
        const mapped = mapNotification(newNotif, user.role);
        setNotifications((prev) => {
          // Avoid duplicate
          const exists = prev.some((item) => item.id === mapped.id);
          if (exists) return prev;
          return [mapped, ...prev];
        });
      });

      // Relay session_created event to other components
      socket.on('session_created', (session) => {
        window.dispatchEvent(new CustomEvent('session_created', { detail: session }));
      });
    }

    return () => {
      window.removeEventListener('unread_counts_updated', handleUpdate);
      if (socket) {
        socket.emit('leave_user', user._id);
        socket.off('receive_message', handleUpdate);
        socket.off('conversation_updated', handleUpdate);
        socket.off('messages_read', handleUpdate);
        socket.off('new_notification');
        socket.off('session_created');
      }
    };
  }, [user?._id]);

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
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const isMessagesLink = link.name === 'Messages';
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
                {isMessagesLink && unreadChatsCount > 0 && (
                  <span className="sidebar-unread-badge" title={`${unreadChatsCount} unread chats`}>
                    {unreadChatsCount}
                  </span>
                )}
              </NavLink>
            );
          })}
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
                  onClick={() => {
                    const willOpen = !showNotifications;
                    setShowNotifications(willOpen);
                    if (willOpen) {
                      handleMarkNotificationsRead();
                    }
                  }}
                >
                  <Bell size={18} />
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="notification-badge">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
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
                          onClick={handleClearAllNotifications}
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

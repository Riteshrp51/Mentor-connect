import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';
import {
  FileText,
  Calendar,
  Star,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  Edit3,
  HelpCircle,
  MessageSquare,
  Video,
  Copy,
  Eye,
  Plus,
} from 'lucide-react';
import { getSessionTiming } from '../utils/sessionTiming';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

const MentorDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRequestsCount: 0,
    sessionsCount: 0,
    unreadMessagesCount: 0,
    averageRating: 0.0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(() => {
    return Boolean(
      user?.isProfileCompleted ||
      localStorage.getItem(`profile_completed_${user?._id || user?.id}`) === 'true'
    );
  });
  const [toastMessage, setToastMessage] = useState('');

  const [pendingRequests, setPendingRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (user?.isProfileCompleted || localStorage.getItem(`profile_completed_${user?._id || user?.id}`) === 'true') {
      setProfileCompleted(true);
    }
  }, [user]);

  const fetchSummaryAndRequests = async () => {
    try {
      setLoading(true);
      const [summaryRes, requestsRes, sessionsRes] = await Promise.allSettled([
        api.get('/api/mentor/dashboard-summary'),
        api.get('/api/requests/received'),
        api.get('/api/sessions')
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.status === 'success') {
        setStats(summaryRes.value.data.data);
      }

      if (requestsRes.status === 'fulfilled' && requestsRes.value?.data?.status === 'success') {
        const received = requestsRes.value.data.data || [];
        setPendingRequests(received.filter((r) => r.status === 'pending'));
      }

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.data?.status === 'success') {
        setSessions(sessionsRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching mentor dashboard data:', err);
      setError('Failed to fetch stats. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndRequests();

    const handleUpdate = () => {
      fetchSummaryAndRequests();
    };

    window.addEventListener('unread_counts_updated', handleUpdate);
    window.addEventListener('session_created', handleUpdate);

    if (socket) {
      socket.on('session_created', handleUpdate);
      socket.on('session_cancelled', handleUpdate);
    }

    return () => {
      window.removeEventListener('unread_counts_updated', handleUpdate);
      window.removeEventListener('session_created', handleUpdate);
      if (socket) {
        socket.off('session_created', handleUpdate);
        socket.off('session_cancelled', handleUpdate);
      }
    };
  }, []);

  const handleCopyRoomCode = (code, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToastMessage(`Room Code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(''), 2500);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/api/requests/${requestId}/accept`);
      if (res.data && res.data.status === 'success') {
        setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setStats((prev) => ({
          ...prev,
          pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
        }));
        setToastMessage('Mentorship request accepted! Conversation opened.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert(err.response?.data?.message || 'Failed to accept mentorship request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to decline this mentorship request?')) return;
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/api/requests/${requestId}/reject`);
      if (res.data && res.data.status === 'success') {
        setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setStats((prev) => ({
          ...prev,
          pendingRequestsCount: Math.max(0, prev.pendingRequestsCount - 1),
        }));
        setToastMessage('Mentorship request declined.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to decline request:', err);
      alert(err.response?.data?.message || 'Failed to decline request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Real session calculations from MongoDB with real-time lifecycle
  const processedSessions = sessions.map((s) => ({
    session: s,
    timing: getSessionTiming(s),
  }));

  const todayStr = new Date().toDateString();
  const todaySessions = processedSessions.filter(
    ({ session, timing }) => session.status !== 'cancelled' && timing.startTime.toDateString() === todayStr
  );
  const activeUpcomingSessions = processedSessions.filter(
    ({ session, timing }) => session.status !== 'cancelled' && !timing.isExpired
  );
  const displaySessions = todaySessions.length > 0 ? todaySessions : activeUpcomingSessions;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Welcome back, {user?.name}!
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review pending student applications, schedule meetings, and manage your ratings.
        </p>
      </div>

      {toastMessage && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {error && (
        <div className="api-error-state" style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px' }}>
          <AlertCircle size={18} />
          <span style={{ marginLeft: '8px' }}>{error}</span>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="stats-cards-row">
        <div
          className="stat-widget-card"
          onClick={() => navigate('/mentor/requests')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper blue">
            <FileText size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : (stats.pendingRequestsCount || 0)}</span>
            <span className="stat-label">Pending Requests</span>
          </div>
        </div>

        <div
          className="stat-widget-card"
          onClick={() => navigate('/mentor/sessions')}
          style={{ cursor: 'pointer' }}
          title="View Mentoring Sessions"
        >
          <div className="stat-icon-wrapper emerald">
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : (stats.sessionsCount !== undefined ? stats.sessionsCount : upcomingSessions.length)}</span>
            <span className="stat-label">Upcoming Sessions</span>
          </div>
        </div>

        <div
          className="stat-widget-card"
          onClick={() => navigate('/mentor/messages')}
          style={{ cursor: 'pointer' }}
          title="View Messages"
        >
          <div className="stat-icon-wrapper violet">
            <MessageSquare size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : (stats.unreadMessagesCount || 0)}</span>
            <span className="stat-label">Unread Messages</span>
          </div>
        </div>

        <div className="stat-widget-card">
          <div className="stat-icon-wrapper amber">
            <Star size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : (stats.averageRating ? stats.averageRating.toFixed(1) : '5.0')}</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Expands to full-width when profile is completed */}
      <div className={`dashboard-grid ${profileCompleted ? 'full-width' : ''}`}>
        {/* Left Side: Pending Requests and Today's Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Requests Widget: ONLY shown if there are pending requests */}
          {pendingRequests.length > 0 && (
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="dashboard-card-title" style={{ margin: 0 }}>
                  <User size={20} style={{ color: 'var(--primary)' }} />
                  Pending Mentorship Requests ({pendingRequests.length})
                </h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate('/mentor/requests')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>View all</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="placeholder-list">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div className="placeholder-list-item" key={req._id}>
                    <div className="item-left">
                      <div className="item-icon-circle">
                        {req.studentId?.profileImage ? (
                          <img
                            src={req.studentId.profileImage}
                            alt={req.studentId.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className="item-details">
                        <h4>{req.studentId?.name || 'Student'}</h4>
                        <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>
                          {req.studentId?.headline || 'Mentee'}
                        </p>
                        <p style={{ marginTop: '4px' }}>Topic: "{req.topic}"</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleAcceptRequest(req._id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          disabled={actionLoadingId === req._id}
                          onClick={() => handleDeclineRequest(req._id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Sessions Widget */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dashboard-card-title" style={{ margin: 0 }}>
                <Calendar size={20} style={{ color: 'var(--accent)' }} />
                Today's Mentoring Sessions {displaySessions.length > 0 && `(${displaySessions.length})`}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => navigate('/mentor/sessions')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View calendar</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {displaySessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Calendar size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Sessions Today
                </h4>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  Scheduled 1:1 sessions for today will appear here with live room codes.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displaySessions.map(({ session, timing }) => {
                  const student = session.studentId;
                  const studentName = student?.name || 'Student Mentee';
                  const studentAvatar = student?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  const studentRole = student?.headline || 'Mentee Student';

                  return (
                    <div
                      key={session._id || session.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 18px',
                        borderRadius: '12px',
                        backgroundColor: timing.isExpired ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-secondary)',
                        border: timing.isLive
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : timing.isExpired
                          ? '1px solid var(--border-light)'
                          : '1px solid var(--border-light)',
                        boxShadow: timing.isLive ? '0 0 12px rgba(239, 68, 68, 0.15)' : 'none',
                        opacity: timing.isExpired ? 0.85 : 1,
                        gap: '16px',
                        flexWrap: 'wrap',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                        <img
                          src={studentAvatar}
                          alt={studentName}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: timing.isLive ? '2px solid #ef4444' : '2px solid var(--primary)',
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                              {session.topic}
                            </h4>
                            {timing.isLive && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#ef4444',
                                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                                Live Now ({timing.remainingMinutes}m left)
                              </span>
                            )}
                            {timing.isExpired && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                }}
                              >
                                <CheckCircle2 size={11} />
                                Completed ({session.durationMinutes}m)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Mentee: <strong>{studentName}</strong> ({studentRole})
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} style={{ color: timing.isLive ? '#ef4444' : 'var(--primary)' }} />
                              {timing.formattedDate} • {timing.formattedTime} - {timing.formattedEndTime}
                            </span>
                            <span>•</span>
                            <span>{session.durationMinutes} mins</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Room Code Badge */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: 'var(--primary)',
                          }}
                          title="Room Code"
                        >
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Room:</span>
                          <span>{session.roomCode}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyRoomCode(session.roomCode, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '2px',
                              display: 'flex',
                            }}
                            title="Copy Room Code"
                          >
                            {copiedCode === session.roomCode ? (
                              <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/mentor/sessions')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <Eye size={13} />
                          Details
                        </button>

                        {timing.isExpired ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--text-muted)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            Session Ended
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/mentor/sessions?room=${session.roomCode}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '12px',
                              fontWeight: '700',
                              backgroundColor: timing.isLive ? '#ef4444' : undefined,
                              borderColor: timing.isLive ? '#ef4444' : undefined,
                            }}
                          >
                            <Video size={13} />
                            {timing.isLive ? 'Join Live Call' : 'Join Call'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Complete Profile Card (Hidden once details are completed) */}
        {!profileCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="complete-profile-widget">
              <div className="complete-profile-badge">
                <Sparkles size={12} />
                <span>Action Recommended</span>
              </div>

              <h3 className="complete-profile-title">
                Complete Your Profile
              </h3>

              <div className="complete-profile-why-box">
                <div className="complete-profile-why-label">
                  <HelpCircle size={13} />
                  <span>Why complete your mentor profile?</span>
                </div>
                <p className="complete-profile-why-text">
                  A complete mentor profile allows students to discover you in the mentor directory, view your company expertise, and book 1-on-1 sessions.
                </p>
              </div>

              <div className="complete-profile-list">
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Select Service Categories (Mock Interviews, Career Counseling, Doubt Solver)</span>
                </div>
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Select Seniority Level & Job Title</span>
                </div>
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Configure Technical & Core Tech Stack Tags</span>
                </div>
              </div>

              <button
                className="btn btn-primary complete-profile-btn"
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Edit3 size={15} />
                <span>Edit Your Profile</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSuccess={() => {
          setProfileCompleted(true);
          setToastMessage('Mentor profile updated successfully!');
          setTimeout(() => setToastMessage(''), 4000);
        }}
      />
    </div>
  );
};

export default MentorDashboardHome;

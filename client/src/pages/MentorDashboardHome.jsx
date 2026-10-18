import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FileText,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

const MentorDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRequestsCount: 0,
    sessionsCount: 0,
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

  useEffect(() => {
    if (user?.isProfileCompleted || localStorage.getItem(`profile_completed_${user?._id || user?.id}`) === 'true') {
      setProfileCompleted(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/mentor/dashboard-summary');
        if (res.data && res.data.status === 'success') {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching mentor dashboard stats:', err);
        setError('Failed to fetch stats. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Mock list items for widgets
  const mockPendingRequests = [
    {
      id: 'r1',
      studentName: 'Emily Taylor',
      major: 'Computer Science Sophomore',
      topic: 'Vite + React Setup & Best Practices',
      date: 'Requested 2 hours ago',
    },
    {
      id: 'r2',
      studentName: 'Daniel Kim',
      major: 'Self-taught Web Developer',
      topic: 'Full-stack Portfolio Review & Mock Interview',
      date: 'Requested yesterday',
    },
  ];

  const mockTodaySessions = [
    {
      id: 's1',
      studentName: 'Jane Smith',
      time: '3:00 PM - 4:00 PM (Today)',
      type: 'Technical Mentorship Video Call',
    },
    {
      id: 's2',
      studentName: 'Chris Evans',
      time: '5:30 PM - 6:00 PM (Today)',
      type: 'Career Guidance & Resume Check',
    },
  ];

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
            <span className="stat-value">{loading ? '...' : stats.pendingRequestsCount}</span>
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
            <span className="stat-value">{loading ? '...' : (stats.sessionsCount || 2)}</span>
            <span className="stat-label">Today's Sessions</span>
          </div>
        </div>

        <div className="stat-widget-card">
          <div className="stat-icon-wrapper amber">
            <Star size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : stats.averageRating.toFixed(1)}</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Expands to full-width when profile is completed */}
      <div className={`dashboard-grid ${profileCompleted ? 'full-width' : ''}`}>
        {/* Left Side: Pending Requests and Today's Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Requests Widget */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dashboard-card-title" style={{ margin: 0 }}>
                <User size={20} style={{ color: 'var(--primary)' }} />
                Pending Mentorship Requests
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
              {mockPendingRequests.map((req) => (
                <div className="placeholder-list-item" key={req.id}>
                  <div className="item-left">
                    <div className="item-icon-circle">
                      <User size={18} />
                    </div>
                    <div className="item-details">
                      <h4>{req.studentName}</h4>
                      <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>
                        {req.major}
                      </p>
                      <p style={{ marginTop: '4px' }}>Topic: "{req.topic}"</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.date}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Accept
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Sessions Widget */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="dashboard-card-title" style={{ margin: 0 }}>
                <Calendar size={20} style={{ color: 'var(--accent)' }} />
                Today's Mentoring Sessions
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

            <div className="placeholder-list">
              {mockTodaySessions.map((session) => (
                <div className="placeholder-list-item" key={session.id}>
                  <div className="item-left">
                    <div className="item-icon-circle" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <Clock size={18} />
                    </div>
                    <div className="item-details">
                      <h4>Session with {session.studentName}</h4>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <strong>{session.time}</strong>
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{session.type}</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => navigate('/mentor/sessions')}
                    style={{ alignSelf: 'center' }}
                  >
                    Join Call
                  </button>
                </div>
              ))}
            </div>
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

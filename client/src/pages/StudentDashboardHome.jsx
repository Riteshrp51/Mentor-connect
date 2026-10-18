import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FileText,
  Calendar,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Star,
  UserCheck,
  Sparkles,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import RequestMentorshipModal from '../components/RequestMentorshipModal';
import MentorProfileModal from '../components/MentorProfileModal';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

const sampleFallbackMentors = [
  {
    _id: 'm1',
    name: 'Dr. Sarah Jenkins',
    title: 'CSE Tech Doubt Solver',
    company: 'Google',
    rating: { average: 4.9, count: 42 },
    expertise: ['Python', 'Core CS (OS/DBMS)', 'DSA', 'PyTorch'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    _id: 'm2',
    name: 'Alex Rivera',
    title: 'Mock Interview Specialist',
    company: 'Netflix',
    rating: { average: 4.8, count: 29 },
    expertise: ['Coding/DSA Rounds', 'System Design', 'Behavioral HR'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    _id: 'm3',
    name: 'Priya Patel',
    title: 'Career Counselor & Strategist',
    company: 'Airbnb',
    rating: { average: 5.0, count: 51 },
    expertise: ['Career Roadmapping', 'Resume Review', 'Higher Studies'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    _id: 'm4',
    name: 'Marcus Chen',
    title: 'Sales & Business Strategy',
    company: 'AWS',
    rating: { average: 4.7, count: 38 },
    expertise: ['B2B Tech Sales', 'Pitching & Discovery', 'Enterprise Growth'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

const StudentDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    requestsCount: 0,
    sessionsCount: 0,
    unreadMessagesCount: 0,
  });
  const [recommendedMentors, setRecommendedMentors] = useState(sampleFallbackMentors);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [selectedMentorForPreview, setSelectedMentorForPreview] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(() => {
    return Boolean(
      user?.isProfileCompleted ||
      localStorage.getItem(`profile_completed_${user?._id || user?.id}`) === 'true'
    );
  });
  const [toastMessage, setToastMessage] = useState('');
  const carouselRef = useRef(null);

  useEffect(() => {
    if (user?.isProfileCompleted || localStorage.getItem(`profile_completed_${user?._id || user?.id}`) === 'true') {
      setProfileCompleted(true);
    }
  }, [user]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/student/dashboard-summary');
      if (res.data && res.data.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching student dashboard stats:', err);
      setError('Failed to fetch stats. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedMentors = async () => {
    try {
      const res = await api.get('/api/mentors', { params: { limit: 6 } });
      if (res.data && res.data.status === 'success' && res.data.data.mentors?.length > 0) {
        setRecommendedMentors(res.data.data.mentors);
      }
    } catch (err) {
      console.error('Error fetching recommended mentors:', err);
      // Keep sample mentors on error
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await api.get('/api/requests/sent');
      if (res.data && res.data.status === 'success') {
        setSentRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sent requests in student dashboard:', err);
    }
  };

  const getMentorConnectionStatus = (mentor) => {
    if (!mentor || !user || !sentRequests.length) return null;
    const mentorUserId =
      typeof mentor.userId === 'object' && mentor.userId !== null
        ? String(mentor.userId._id || mentor.userId.id || '')
        : String(mentor.userId || mentor._id || mentor.id || '');
    const mentorProfileId = String(mentor._id || mentor.id || '');

    const matchingReq = sentRequests.find((req) => {
      const reqMentorId =
        typeof req.mentorId === 'object' && req.mentorId !== null
          ? String(req.mentorId._id || req.mentorId.id || '')
          : String(req.mentorId || '');
      return (
        (reqMentorId && reqMentorId === mentorUserId) ||
        (reqMentorId && reqMentorId === mentorProfileId)
      );
    });

    if (!matchingReq) return null;
    if (matchingReq.status === 'accepted') return 'connected';
    if (matchingReq.status === 'pending') return 'pending';
    return null;
  };

  useEffect(() => {
    fetchSummary();
    fetchRecommendedMentors();
    fetchSentRequests();
  }, []);

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Welcome back, {user?.name}!
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your applications, upcoming sessions, and recommendations all in one place.
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
          }}
        >
          {toastMessage}
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
          onClick={() => navigate('/student/requests')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper blue">
            <FileText size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : stats.requestsCount}</span>
            <span className="stat-label">Active Requests</span>
          </div>
        </div>

        <div
          className="stat-widget-card"
          onClick={() => navigate('/student/sessions')}
          style={{ cursor: 'pointer' }}
          title="View Sessions Calendar"
        >
          <div className="stat-icon-wrapper emerald">
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : (stats.sessionsCount || 2)}</span>
            <span className="stat-label">Upcoming Sessions</span>
          </div>
        </div>

        <div
          className="stat-widget-card"
          onClick={() => navigate('/student/messages')}
          style={{ cursor: 'pointer' }}
          title="Open Messages"
        >
          <div className="stat-icon-wrapper purple">
            <MessageSquare size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{loading ? '...' : stats.unreadMessagesCount}</span>
            <span className="stat-label">Unread Messages</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Expands to full-width when profile is completed */}
      <div className={`dashboard-grid ${profileCompleted ? 'full-width' : ''}`}>
        {/* Left Side: Mentors Carousel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="dashboard-card-title" style={{ margin: 0 }}>
                <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
                Recommended Mentors for You
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="carousel-btn"
                  onClick={() => handleScroll('left')}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="carousel-btn"
                  onClick={() => handleScroll('right')}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Based on your career interests and skill gaps, we suggest reaching out to these highly-rated mentors.
            </p>

            <div className="carousel-container">
              <div className="carousel-track" ref={carouselRef}>
                {recommendedMentors.map((mentor) => {
                  const mentorName = mentor.userId?.name || mentor.name || 'Mentor';
                  const mentorAvatar =
                    mentor.userId?.profileImage ||
                    mentor.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  const mentorCompany = mentor.company || mentor.title || 'Company';
                  const mentorDomain = mentor.domain || mentor.title || 'General Mentorship';
                  const mentorRating = mentor.rating?.average || mentor.rating || 5.0;
                  const mentorReviews = mentor.rating?.count || mentor.reviews || 0;
                  const skills = mentor.expertise || mentor.skills || [];
                  const connectionStatus = getMentorConnectionStatus(mentor);

                  return (
                    <div className="carousel-card" key={mentor._id || mentor.id}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                        <img
                          src={mentorAvatar}
                          alt={mentorName}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--primary-light)',
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {mentorName}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Briefcase size={12} />
                            {mentorCompany} • {mentorDomain}
                          </p>
                        </div>
                      </div>

                      {connectionStatus === 'connected' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                          <CheckCircle2 size={11} />
                          Already Connected
                        </div>
                      )}

                      {connectionStatus === 'pending' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                          <Clock size={11} />
                          Request Pending
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px', fontSize: '13px' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <strong style={{ color: 'var(--text-primary)' }}>{mentorRating}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>({mentorReviews} reviews)</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {connectionStatus ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedMentorForPreview(mentor)}
                          style={{
                            width: '100%',
                            fontSize: '13px',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                          }}
                        >
                          View Profile
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedMentorForPreview(mentor)}
                            style={{
                              flex: 1,
                              fontSize: '12px',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                            }}
                          >
                            View Profile
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedMentorForRequest(mentor)}
                            style={{
                              flex: 1.2,
                              fontSize: '12px',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontWeight: '600',
                            }}
                          >
                            <UserCheck size={13} />
                            Connect
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                  <span>Why complete your profile?</span>
                </div>
                <p className="complete-profile-why-text">
                  Mentors review your background before accepting sessions. Completing your profile gives you <strong>3x higher request acceptance</strong> and tailored recommendations.
                </p>
              </div>

              <div className="complete-profile-list">
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Select Mentorship Goals (Mock Interviews, Resume, Doubt Clearing)</span>
                </div>
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Specify Key Challenge Areas & friction points</span>
                </div>
                <div className="complete-profile-list-item">
                  <CheckCircle size={15} />
                  <span>Add Technical Skill Matrix & metrics</span>
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
          setToastMessage('Profile settings updated successfully!');
          setTimeout(() => setToastMessage(''), 4000);
        }}
      />

      {/* Mentor Profile Preview Modal */}
      <MentorProfileModal
        mentor={selectedMentorForPreview}
        isOpen={Boolean(selectedMentorForPreview)}
        onClose={() => setSelectedMentorForPreview(null)}
        connectionStatus={selectedMentorForPreview ? getMentorConnectionStatus(selectedMentorForPreview) : null}
        onRequestMentorship={(mentor) => {
          setSelectedMentorForPreview(null);
          setSelectedMentorForRequest(mentor);
        }}
      />

      {/* Mentorship Request Modal */}
      <RequestMentorshipModal
        mentor={selectedMentorForRequest}
        isOpen={Boolean(selectedMentorForRequest)}
        onClose={() => setSelectedMentorForRequest(null)}
        connectionStatus={selectedMentorForRequest ? getMentorConnectionStatus(selectedMentorForRequest) : null}
        onSuccess={() => {
          setToastMessage('Mentorship request sent successfully!');
          fetchSummary();
          fetchSentRequests();
          setTimeout(() => setToastMessage(''), 4000);
        }}
      />
    </div>
  );
};

export default StudentDashboardHome;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Star,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  PhoneOff,
  Send,
  Download
} from 'lucide-react';
import './SessionsPage.css';

const DEFAULT_SESSIONS = [
  {
    id: 'sess-1',
    topic: 'Full-Stack Architecture & React Optimization',
    mentorName: 'Dr. Sarah Jenkins',
    mentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    mentorCompany: 'Google',
    studentName: 'Sneha Kapoor',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    date: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
    durationMinutes: 45,
    format: 'video',
    formatLabel: '1:1 Video Mentorship',
    agenda: 'Reviewing component tree memoization, custom hooks architecture, and optimizing render performance.',
    status: 'upcoming',
    roomCode: 'mc-arch-7842'
  },
  {
    id: 'sess-2',
    topic: 'Mock Technical Interview: Frontend & System Design',
    mentorName: 'Alex Rivera',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mentorCompany: 'Netflix',
    studentName: 'Rohan Verma',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    date: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(), // Tomorrow
    durationMinutes: 60,
    format: 'interview',
    formatLabel: 'Mock Interview (FAANG)',
    agenda: 'Live coding algorithmic problem on binary trees followed by frontend performance architecture walkthrough.',
    status: 'upcoming',
    roomCode: 'mc-mock-9912'
  },
  {
    id: 'sess-3',
    topic: 'Resume Deep Dive & Portfolio Review',
    mentorName: 'Priya Patel',
    mentorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    mentorCompany: 'Airbnb',
    studentName: 'Sneha Kapoor',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    durationMinutes: 45,
    format: 'review',
    formatLabel: 'Portfolio & Resume Review',
    agenda: 'Refined project bullet points with quantifiable impact metrics and updated case studies.',
    status: 'completed',
    rating: 5,
    notesSummary: 'Strong technical foundations. Refactored project impact descriptions to highlight 40% latency reduction.'
  }
];

const SessionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'calendar'
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('mentorconnect_sessions');
    return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
  });

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('15:00');
  const [scheduleDuration, setScheduleDuration] = useState(45);
  const [scheduleFormat, setScheduleFormat] = useState('video');
  const [scheduleAgenda, setScheduleAgenda] = useState('');
  const [scheduleParticipant, setScheduleParticipant] = useState(
    user?.role === 'student' ? 'Dr. Sarah Jenkins (Google)' : 'Sneha Kapoor (Student)'
  );

  // Video Call Simulator State
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [inCallMessages, setInCallMessages] = useState([
    { sender: 'System', text: 'Call connected with encrypted peer channel.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('mentorconnect_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Call timer
  useEffect(() => {
    let timer;
    if (activeCallSession) {
      timer = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeCallSession]);

  const isStudent = user?.role === 'student';

  const upcomingSessions = sessions.filter((s) => s.status === 'upcoming');
  const pastSessions = sessions.filter((s) => s.status === 'completed');

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!scheduleTopic.trim() || !scheduleDate) return;

    const newSession = {
      id: `sess-${Date.now()}`,
      topic: scheduleTopic.trim(),
      mentorName: isStudent ? scheduleParticipant.split(' (')[0] : user.name,
      mentorAvatar: isStudent
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
        : user.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      mentorCompany: isStudent ? 'Google' : 'Staff Engineer',
      studentName: isStudent ? user.name : scheduleParticipant.split(' (')[0],
      studentAvatar: isStudent
        ? user.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      date: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
      durationMinutes: Number(scheduleDuration),
      format: scheduleFormat,
      formatLabel:
        scheduleFormat === 'video'
          ? '1:1 Video Mentorship'
          : scheduleFormat === 'interview'
          ? 'Mock Technical Interview'
          : 'Resume & Project Review',
      agenda: scheduleAgenda.trim() || 'General 1-on-1 mentorship session and questions.',
      status: 'upcoming',
      roomCode: `mc-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setSessions([newSession, ...sessions]);
    setIsScheduleModalOpen(false);
    setScheduleTopic('');
    setScheduleAgenda('');
    setToastMessage('New mentorship session successfully scheduled!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCancelSession = (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled session?')) return;
    setSessions(sessions.filter((s) => s.id !== sessionId));
    setToastMessage('Session cancelled.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendCallChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setInCallMessages((prev) => [
      ...prev,
      { sender: user.name, text: chatInput.trim(), time: 'Just now' }
    ]);
    setChatInput('');
  };

  const handleEndCall = () => {
    if (activeCallSession) {
      setToastMessage(`Session "${activeCallSession.topic}" ended.`);
      setTimeout(() => setToastMessage(''), 4000);
    }
    setActiveCallSession(null);
  };

  return (
    <div className="sessions-page-container">
      {/* Page Header */}
      <div className="sessions-header">
        <div className="sessions-title-group">
          <h1>{isStudent ? 'My Mentorship Sessions' : 'Mentoring Schedule & Sessions'}</h1>
          <p>
            {isStudent
              ? 'Join upcoming video calls, schedule 1:1 sessions, and review past meeting notes.'
              : 'Manage student consultations, launch virtual video meetings, and review past notes.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsScheduleModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Schedule Session
          </button>
        </div>
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
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="sessions-stats-grid">
        <div className="session-stat-card">
          <div className="session-stat-icon blue">
            <Calendar size={22} />
          </div>
          <div>
            <div className="session-stat-value">{upcomingSessions.length}</div>
            <div className="session-stat-label">Upcoming Sessions</div>
          </div>
        </div>

        <div className="session-stat-card">
          <div className="session-stat-icon emerald">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="session-stat-value">{pastSessions.length}</div>
            <div className="session-stat-label">Completed Sessions</div>
          </div>
        </div>

        <div className="session-stat-card">
          <div className="session-stat-icon amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="session-stat-value">3.5 hrs</div>
            <div className="session-stat-label">Mentoring Time</div>
          </div>
        </div>

        <div className="session-stat-card">
          <div className="session-stat-icon purple">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="session-stat-value">5.0 / 5.0</div>
            <div className="session-stat-label">Session Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sessions-tabs-nav">
        <button
          type="button"
          className={`sessions-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Video size={16} />
          <span>Upcoming Sessions</span>
          <span className="tab-badge">{upcomingSessions.length}</span>
        </button>

        <button
          type="button"
          className={`sessions-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          <CheckCircle2 size={16} />
          <span>Past Sessions</span>
          <span className="tab-badge">{pastSessions.length}</span>
        </button>

        <button
          type="button"
          className={`sessions-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          <span>Weekly Calendar</span>
        </button>
      </div>

      {/* TAB 1: UPCOMING SESSIONS */}
      {activeTab === 'upcoming' && (
        <div className="sessions-list-grid">
          {upcomingSessions.length === 0 ? (
            <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Upcoming Sessions</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                You have no scheduled calls at the moment. Pick a time slot and connect with your mentor/student.
              </p>
              <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
                Schedule a Session
              </button>
            </div>
          ) : (
            upcomingSessions.map((session) => {
              const sessionDate = new Date(session.date);
              const formattedDate = sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const otherName = isStudent ? session.mentorName : session.studentName;
              const otherAvatar = isStudent ? session.mentorAvatar : session.studentAvatar;
              const otherRole = isStudent ? `Mentor at ${session.mentorCompany}` : 'Student Mentee';

              return (
                <div key={session.id} className="session-item-card">
                  <div className="session-card-header">
                    <div className="session-participant-info">
                      <img src={otherAvatar} alt={otherName} className="session-avatar" />
                      <div>
                        <div className="session-participant-name">{otherName}</div>
                        <div className="session-participant-sub">{otherRole}</div>
                      </div>
                    </div>

                    <span
                      className={`session-format-badge ${
                        session.format === 'interview'
                          ? 'format-interview'
                          : session.format === 'review'
                          ? 'format-review'
                          : 'format-video'
                      }`}
                    >
                      <Video size={13} />
                      {session.formatLabel}
                    </span>
                  </div>

                  <div className="session-card-body">
                    <div>
                      <div className="session-topic-title">{session.topic}</div>
                      <p className="session-agenda-text">{session.agenda}</p>
                    </div>

                    <div className="session-time-block">
                      <div className="session-datetime">
                        <Clock size={16} style={{ color: 'var(--primary)' }} />
                        <span>{formattedDate} • {formattedTime}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Duration: <strong>{session.durationMinutes} minutes</strong>
                      </div>
                      <div className="session-countdown">
                        Room Code: <code>{session.roomCode}</code>
                      </div>
                    </div>
                  </div>

                  <div className="session-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(isStudent ? '/student/messages' : '/mentor/messages')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                      >
                        <MessageSquare size={14} />
                        Message {otherName.split(' ')[0]}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancelSession(session.id)}
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveCallSession(session)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Video size={15} />
                        Join Video Call
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: PAST / COMPLETED SESSIONS */}
      {activeTab === 'past' && (
        <div className="sessions-list-grid">
          {pastSessions.map((session) => {
            const sessionDate = new Date(session.date);
            const otherName = isStudent ? session.mentorName : session.studentName;
            const otherAvatar = isStudent ? session.mentorAvatar : session.studentAvatar;

            return (
              <div key={session.id} className="session-item-card" style={{ opacity: 0.9 }}>
                <div className="session-card-header">
                  <div className="session-participant-info">
                    <img src={otherAvatar} alt={otherName} className="session-avatar" />
                    <div>
                      <div className="session-participant-name">{otherName}</div>
                      <div className="session-participant-sub">Completed on {sessionDate.toLocaleDateString()}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Completed ({session.durationMinutes} min)
                  </span>
                </div>

                <div className="session-card-body">
                  <div>
                    <div className="session-topic-title">{session.topic}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>Mentor Summary Notes:</strong> "{session.notesSummary}"
                    </p>
                  </div>

                  <div className="session-time-block">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      {[...Array(session.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Feedback Submitted
                    </span>
                  </div>
                </div>

                <div className="session-card-footer">
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Session recording and transcript saved to cloud.
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => alert('Downloading session notes PDF...')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} />
                    Download Notes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: WEEKLY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Weekly Mentorship Agenda</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const hasSession = idx === 1 || idx === 3;
              return (
                <div
                  key={day}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: hasSession ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    border: hasSession ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', color: hasSession ? 'var(--primary)' : 'var(--text-primary)' }}>
                    {day}
                  </span>
                  {hasSession ? (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--primary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div>3:00 PM</div>
                      <div style={{ fontWeight: '700', marginTop: '2px' }}>1:1 Mentoring</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>No sessions</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScheduleModalOpen(false);
          }}
        >
          <div
            className="dashboard-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
              Schedule Mentorship Session
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Select session timing, topics, and meeting format.
            </p>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  {isStudent ? 'Select Mentor' : 'Select Student'}
                </label>
                <select
                  value={scheduleParticipant}
                  onChange={(e) => setScheduleParticipant(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                >
                  {isStudent ? (
                    <>
                      <option value="Dr. Sarah Jenkins (Google)">Dr. Sarah Jenkins (Google)</option>
                      <option value="Alex Rivera (Netflix)">Alex Rivera (Netflix)</option>
                      <option value="Priya Patel (Airbnb)">Priya Patel (Airbnb)</option>
                      <option value="Marcus Chen (AWS)">Marcus Chen (AWS)</option>
                    </>
                  ) : (
                    <>
                      <option value="Sneha Kapoor (Student)">Sneha Kapoor (CS Sophomore)</option>
                      <option value="Rohan Verma (Student)">Rohan Verma (Final Year)</option>
                      <option value="Emily Taylor (Student)">Emily Taylor (Web Dev)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Session Topic <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Mock Interview or Frontend Architecture"
                  value={scheduleTopic}
                  onChange={(e) => setScheduleTopic(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Time Slot
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Duration
                  </label>
                  <select
                    value={scheduleDuration}
                    onChange={(e) => setScheduleDuration(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes (Recommended)</option>
                    <option value={60}>60 Minutes (Full Mock)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Session Format
                  </label>
                  <select
                    value={scheduleFormat}
                    onChange={(e) => setScheduleFormat(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="video">1:1 Video Mentorship</option>
                    <option value="interview">Technical Mock Interview</option>
                    <option value="review">Resume & Portfolio Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Agenda & Specific Questions
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key topics you want to cover during the session..."
                  value={scheduleAgenda}
                  onChange={(e) => setScheduleAgenda(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIRTUAL VIDEO CALL SIMULATOR MODAL */}
      {activeCallSession && (
        <div className="call-modal-overlay">
          <div className="call-modal-container">
            {/* Call Header */}
            <div className="call-topbar">
              <div className="call-info-badge">
                <div className="call-live-dot" />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{activeCallSession.topic}</span>
                <span style={{ opacity: 0.6, fontSize: '13px' }}>• Room: {activeCallSession.roomCode}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                  ⏱️ {formatTimer(callDurationSeconds)}
                </div>
              </div>
            </div>

            {/* Main Video & Panel Grid */}
            <div className="call-body-grid">
              {/* Main Remote Feed */}
              <div className="call-main-feed">
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                  <img
                    src={isStudent ? activeCallSession.mentorAvatar : activeCallSession.studentAvatar}
                    alt="Participant"
                    className="call-remote-avatar"
                  />
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginTop: '16px', marginBottom: '4px' }}>
                    {isStudent ? activeCallSession.mentorName : activeCallSession.studentName}
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Speaking • HD 1080p
                  </div>
                </div>

                {/* Picture in picture self stream */}
                <div className="call-pip-self">
                  {isCameraOff ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textAlign: 'center' }}>
                      <CameraOff size={18} style={{ margin: '0 auto 4px auto' }} />
                      Camera Off
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={user?.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt="Self"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ color: '#fff', fontSize: '10px', marginTop: '2px', fontWeight: '600' }}>You ({user?.name.split(' ')[0]})</div>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Call Notes & Chat Sidebar */}
              <div className="call-sidebar-panel">
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px', fontWeight: '700' }}>
                  Live Session Notes & Chat
                </div>

                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Shared Call Notes & Action Items
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Take real-time session notes & takeaways..."
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '12px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inCallMessages.map((msg, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#cbd5e1', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                        <strong>{msg.sender}</strong>
                        <span>{msg.time}</span>
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendCallChat} style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Type in-call note..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '34px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 10px' }}>
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="call-controls-bar">
              <button
                type="button"
                className={`call-control-btn ${isMicMuted ? 'active-off' : ''}`}
                onClick={() => setIsMicMuted(!isMicMuted)}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                type="button"
                className={`call-control-btn ${isCameraOff ? 'active-off' : ''}`}
                onClick={() => setIsCameraOff(!isCameraOff)}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
              </button>

              <button
                type="button"
                className={`call-control-btn ${isScreenSharing ? 'active-off' : ''}`}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                title="Share Screen"
              >
                <ScreenShare size={20} />
              </button>

              <button type="button" className="call-end-btn" onClick={handleEndCall}>
                <PhoneOff size={18} />
                <span>Leave Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPage;

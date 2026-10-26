import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';
import VideoCallRoom from '../components/VideoCallRoom';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Star,
  Download,
  Copy,
  Check,
  Eye,
  Share2,
  X,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { getSessionTiming } from '../utils/sessionTiming';
import './SessionsPage.css';

const SessionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'calendar'
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Contacts available for scheduling
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('15:00');
  const [scheduleDuration, setScheduleDuration] = useState(45);
  const [scheduleFormat, setScheduleFormat] = useState('video');
  const [scheduleAgenda, setScheduleAgenda] = useState('');
  const [submittingSession, setSubmittingSession] = useState(false);

  // View Details Modal State
  const [viewingSession, setViewingSession] = useState(null);

  // Active Video Call Room Session State
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedRoomCode, setCopiedRoomCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharingSessionId, setSharingSessionId] = useState(null);

  const isStudent = user?.role === 'student';

  // 1. Fetch real sessions from MongoDB
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get('/api/sessions');
      if (res.data?.status === 'success') {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 2. Fetch contacts available to schedule with
  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await api.get('/api/sessions/contacts');
      if (res.data?.status === 'success') {
        const list = res.data.data || [];
        setContacts(list);
        if (list.length > 0 && !selectedContactId) {
          setSelectedContactId(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchContacts();

    // Socket & Custom Event synchronization
    const handleSessionCreated = (event) => {
      const newSession = event.detail || event;
      if (!newSession) return;
      setSessions((prev) => {
        const exists = prev.some((s) => (s._id || s.id) === (newSession._id || newSession.id));
        if (exists) return prev;
        return [newSession, ...prev];
      });
      setToastMessage(`New session scheduled: "${newSession.topic}" (Room: ${newSession.roomCode})`);
      setTimeout(() => setToastMessage(''), 5000);
    };

    const handleSessionCancelled = (event) => {
      const data = event.detail || event;
      const sessId = data?.sessionId;
      if (!sessId) return;
      setSessions((prev) =>
        prev.map((s) =>
          ((s._id || s.id) === sessId ? { ...s, status: 'cancelled' } : s)
        )
      );
    };

    window.addEventListener('session_created', handleSessionCreated);

    if (socket) {
      socket.on('session_created', handleSessionCreated);
      socket.on('session_cancelled', handleSessionCancelled);
    }

    return () => {
      window.removeEventListener('session_created', handleSessionCreated);
      if (socket) {
        socket.off('session_created', handleSessionCreated);
        socket.off('session_cancelled', handleSessionCancelled);
      }
    };
  }, []);

  // Auto-launch room if ?room=... is passed in URL
  useEffect(() => {
    const urlRoom = searchParams.get('room');
    if (urlRoom && !activeCallSession) {
      const formatted = urlRoom.trim().toLowerCase();
      const matched = sessions.find((s) => s.roomCode?.toLowerCase() === formatted);
      if (matched) {
        setActiveCallSession(matched);
      } else {
        setActiveCallSession({
          _id: `sess-${Date.now()}`,
          topic: `1-on-1 Mentorship Video Session (${formatted})`,
          roomCode: formatted,
          mentorName: isStudent ? 'Mentor' : user?.name,
          studentName: isStudent ? user?.name : 'Student',
        });
      }
    }
  }, [searchParams, sessions, activeCallSession]);

  const upcomingSessions = sessions.filter((s) => !getSessionTiming(s).isExpired && s.status !== 'cancelled');
  const pastSessions = sessions.filter((s) => getSessionTiming(s).isExpired || s.status === 'completed' || s.status === 'expired');

  // One-click copy room code
  const handleCopyRoomCode = (roomCode, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(roomCode);
    setCopiedRoomCode(roomCode);
    setToastMessage(`Room Code "${roomCode}" copied to clipboard!`);
    setTimeout(() => setCopiedRoomCode(''), 2500);
  };

  // One-click copy full meeting join URL
  const handleCopyMeetingLink = (roomCode, e) => {
    if (e) e.stopPropagation();
    const rolePath = isStudent ? 'student' : 'mentor';
    const url = `${window.location.origin}/${rolePath}/sessions?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setToastMessage('Direct meeting join link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share room code and session invitation directly in chat message
  const handleShareInChat = async (session) => {
    const otherUser = isStudent ? session.mentorId : session.studentId;
    const sessId = session._id || session.id;
    setSharingSessionId(sessId);

    const sessionDate = new Date(session.date);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const sessionTime = session.time || '15:00';
    const rolePath = isStudent ? 'student' : 'mentor';
    const joinUrl = `${window.location.origin}/${rolePath}/sessions?room=${session.roomCode}`;

    const shareText = `📅 Scheduled Mentorship Session: ${session.topic}\n🕒 When: ${formattedDate} at ${sessionTime} (${session.durationMinutes} mins)\n🔑 Room Code: ${session.roomCode}\n🔗 Join Video Call: ${joinUrl}\n📝 Agenda: ${session.agenda || '1-on-1 mentorship session'}`;

    try {
      // Find conversation with this contact
      const res = await api.get('/api/conversations');
      const convs = res.data?.data || [];
      const otherUserId = otherUser?._id?.toString();
      const matchedConv = convs.find((c) =>
        c.participants?.some((p) => (p._id || p)?.toString() === otherUserId)
      );

      if (matchedConv) {
        // Send message directly to conversation
        await api.post(`/api/conversations/${matchedConv._id}/messages`, {
          text: shareText,
        });

        setToastMessage(`Room code ${session.roomCode} shared in chat with ${otherUser?.name || 'attendee'}!`);
        setTimeout(() => {
          navigate(`/${rolePath}/messages?conversationId=${matchedConv._id}`);
        }, 800);
      } else {
        // If conversation not open yet, copy to clipboard and open messages
        navigator.clipboard.writeText(shareText);
        setToastMessage(`Session details copied! Opening messages to connect with ${otherUser?.name || 'attendee'}...`);
        setTimeout(() => {
          navigate(`/${rolePath}/messages`);
        }, 800);
      }
    } catch (err) {
      console.error('Error sharing in chat:', err);
      navigator.clipboard.writeText(shareText);
      setToastMessage(`Room Code ${session.roomCode} copied to clipboard!`);
    } finally {
      setSharingSessionId(null);
    }
  };

  // Submit new scheduled session to backend
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!scheduleTopic.trim() || !scheduleDate || !selectedContactId) {
      setToastMessage('Please fill all required fields and choose a participant.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    try {
      setSubmittingSession(true);
      const payload = {
        participantId: selectedContactId,
        topic: scheduleTopic.trim(),
        agenda: scheduleAgenda.trim(),
        date: scheduleDate,
        time: scheduleTime,
        durationMinutes: Number(scheduleDuration),
        format: scheduleFormat,
      };

      const res = await api.post('/api/sessions', payload);
      if (res.data?.status === 'success') {
        const createdSession = res.data.data;
        setSessions((prev) => [createdSession, ...prev]);
        setIsScheduleModalOpen(false);
        setScheduleTopic('');
        setScheduleAgenda('');
        setToastMessage(`Session scheduled! Room Code: ${createdSession.roomCode} (Notification sent)`);
        setTimeout(() => setToastMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setToastMessage(err.response?.data?.message || 'Failed to schedule session. Please try again.');
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setSubmittingSession(false);
    }
  };

  // Cancel scheduled session
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled session? Both participants will be notified.')) return;

    try {
      const res = await api.patch(`/api/sessions/${sessionId}/cancel`);
      if (res.data?.status === 'success') {
        setSessions((prev) =>
          prev.map((s) => ((s._id || s.id) === sessionId ? { ...s, status: 'cancelled' } : s))
        );
        if (viewingSession && (viewingSession._id || viewingSession.id) === sessionId) {
          setViewingSession((prev) => ({ ...prev, status: 'cancelled' }));
        }
        setToastMessage('Session cancelled. Notification sent to participant.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      setToastMessage('Failed to cancel session.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Quick join room by code
  const handleQuickJoin = (e) => {
    e.preventDefault();
    if (!quickJoinCode.trim()) return;
    const code = quickJoinCode.trim().toLowerCase();
    const matched = sessions.find((s) => s.roomCode?.toLowerCase() === code);
    if (matched) {
      setActiveCallSession(matched);
    } else {
      setActiveCallSession({
        _id: `sess-${Date.now()}`,
        topic: `1-on-1 Mentorship Video Session (${code})`,
        roomCode: code,
        mentorName: isStudent ? 'Mentor' : user?.name,
        studentName: isStudent ? user?.name : 'Student',
      });
    }
    setQuickJoinCode('');
  };

  const handleEndCall = () => {
    if (activeCallSession) {
      setToastMessage(`Left video session "${activeCallSession.topic}".`);
      setTimeout(() => setToastMessage(''), 4000);
    }
    setActiveCallSession(null);
  };

  return (
    <div className="sessions-page-container">
      {/* Header Bar */}
      <div className="sessions-header">
        <div className="sessions-title-group">
          <h1>Live Mentorship Sessions</h1>
          <p>Schedule 1:1 video meetings, share room codes, and join live WebRTC calls.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quick Join Bar */}
          <form onSubmit={handleQuickJoin} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Enter Room Code (e.g. mc-4821)"
              value={quickJoinCode}
              onChange={(e) => setQuickJoinCode(e.target.value)}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                width: '190px'
              }}
            />
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Video size={15} />
              Join
            </button>
          </form>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (contacts.length === 0) fetchContacts();
              setIsScheduleModalOpen(true);
            }}
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
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
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
            <div className="session-stat-value">
              {pastSessions.length > 0
                ? `${(pastSessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0) / 60).toFixed(1)} hrs`
                : '0 hrs'}
            </div>
            <div className="session-stat-label">Mentoring Time</div>
          </div>
        </div>

        <div className="session-stat-card">
          <div className="session-stat-icon purple">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="session-stat-value">
              {pastSessions.length > 0
                ? `${(pastSessions.reduce((acc, s) => acc + (Number(s.rating) || 5), 0) / pastSessions.length).toFixed(1)} / 5.0`
                : '5.0'}
            </div>
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
          {loadingSessions ? (
            <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <RefreshCw size={32} className="spinning" style={{ color: 'var(--primary)', margin: '0 auto 16px auto' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading scheduled sessions...</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Upcoming Sessions</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                You have no scheduled calls right now. Schedule a session with your {isStudent ? 'mentor' : 'student'} to get started!
              </p>
              <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
                Schedule a Session
              </button>
            </div>
          ) : (
            upcomingSessions.map((session) => {
              const timing = getSessionTiming(session);
              const otherUser = isStudent ? session.mentorId : session.studentId;
              const otherName = otherUser?.name || (isStudent ? 'Mentor' : 'Student Mentee');
              const otherAvatar =
                otherUser?.profileImage ||
                (isStudent
                  ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
              const otherRole = isStudent
                ? (session.mentorCompany ? `Mentor at ${session.mentorCompany}` : 'Mentor')
                : (otherUser?.headline || 'Mentee Student');

              const sessId = session._id || session.id;

              return (
                <div
                  key={sessId}
                  className="session-item-card"
                  style={{
                    border: timing.isLive ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                    boxShadow: timing.isLive ? '0 0 16px rgba(239, 68, 68, 0.15)' : undefined,
                  }}
                >
                  <div className="session-card-header">
                    <div className="session-participant-info">
                      <img
                        src={otherAvatar}
                        alt={otherName}
                        className="session-avatar"
                        style={{ border: timing.isLive ? '2px solid #ef4444' : undefined }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div className="session-participant-name">{otherName}</div>
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
                        </div>
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
                      {session.formatLabel || '1:1 Video Mentorship'}
                    </span>
                  </div>

                  <div className="session-card-body">
                    <div>
                      <div className="session-topic-title">{session.topic}</div>
                      <p className="session-agenda-text">
                        {session.agenda || 'General 1-on-1 mentorship session and discussion.'}
                      </p>
                    </div>

                    <div className="session-time-block">
                      <div className="session-datetime">
                        <Clock size={16} style={{ color: timing.isLive ? '#ef4444' : 'var(--primary)' }} />
                        <span>{timing.formattedDate} • {timing.formattedTime} - {timing.formattedEndTime}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Duration: <strong>{session.durationMinutes} minutes</strong>
                      </div>

                      {/* Room Code Badge with Instant Copy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div className="session-room-badge" title="Room Code for this call">
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room:</span>
                          <span>{session.roomCode}</span>
                          <button
                            type="button"
                            className="session-copy-btn"
                            onClick={(e) => handleCopyRoomCode(session.roomCode, e)}
                            title="Copy Room Code"
                          >
                            {copiedRoomCode === session.roomCode ? (
                              <Check size={13} style={{ color: '#10b981' }} />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row: Details, Share in Chat, Cancel, Join */}
                  <div className="session-card-actions-wrapper">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewingSession(session)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px' }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={sharingSessionId === sessId}
                        onClick={() => handleShareInChat(session)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 10px', color: 'var(--primary)' }}
                        title="Share room code and join link directly into chat message"
                      >
                        <Share2 size={13} />
                        Share in Chat
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancelSession(sessId)}
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '12px', padding: '6px 10px' }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setActiveCallSession(session)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '700',
                          backgroundColor: timing.isLive ? '#ef4444' : undefined,
                          borderColor: timing.isLive ? '#ef4444' : undefined,
                        }}
                      >
                        <Video size={15} />
                        {timing.isLive ? 'Join Live Call' : 'Join Session'}
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
          {pastSessions.length === 0 ? (
            <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No Completed Sessions Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                Completed session notes, takeaways, and feedback will be archived here.
              </p>
            </div>
          ) : (
            pastSessions.map((session) => {
              const timing = getSessionTiming(session);
              const otherUser = isStudent ? session.mentorId : session.studentId;
              const otherName = otherUser?.name || (isStudent ? 'Mentor' : 'Student');
              const otherAvatar =
                otherUser?.profileImage ||
                (isStudent
                  ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

              return (
                <div key={session._id || session.id} className="session-item-card" style={{ opacity: 0.9 }}>
                  <div className="session-card-header">
                    <div className="session-participant-info">
                      <img src={otherAvatar} alt={otherName} className="session-avatar" />
                      <div>
                        <div className="session-participant-name">{otherName}</div>
                        <div className="session-participant-sub">
                          Concluded on {timing.formattedDate} at {timing.formattedEndTime}
                        </div>
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
                        <strong>Agenda & Summary:</strong> "{session.agenda || 'Completed 1-on-1 mentoring session.'}"
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
                      Room Code: <code>{session.roomCode}</code>
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewingSession(session)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: WEEKLY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Weekly Mentorship Agenda</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const daySession = upcomingSessions.find((s) => {
                const d = new Date(s.date);
                const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return dayMap[d.getDay()] === day;
              });
              const hasSession = Boolean(daySession);
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
                        backgroundColor: 'var(--bg-card, #fff)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--primary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div>{new Date(daySession.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {daySession.topic}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Room: {daySession.roomCode}
                      </div>
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
              border: '1px solid var(--border-light)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Schedule Mentorship Session
              </h2>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Fill in session details. A notification with the room code will be sent to the participant immediately.
            </p>

            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  {isStudent ? 'Select Mentor' : 'Select Student'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {loadingContacts ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading contacts...</div>
                ) : contacts.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#ef4444' }}>
                    No contacts found. Please connect with a {isStudent ? 'mentor' : 'student'} first.
                  </div>
                ) : (
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    {contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} — {c.company || c.headline || (c.role === 'mentor' ? 'Mentor' : 'Student')} ({c.relationship || 'Connected'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Session Topic <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Mock Interview or Frontend Architecture Review"
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
                    Time Slot <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    required
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
                    <option value={60}>60 Minutes (Full Session)</option>
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
                  Agenda & Discussion Points
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
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingSession || contacts.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submittingSession ? (
                    <>
                      <RefreshCw size={14} className="spinning" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Confirm & Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SESSION DETAILS MODAL */}
      {viewingSession && (() => {
        const sessionDate = new Date(viewingSession.date);
        const formattedDate = sessionDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        const formattedTime = viewingSession.time || sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const otherUser = isStudent ? viewingSession.mentorId : viewingSession.studentId;
        const otherName = otherUser?.name || (isStudent ? 'Mentor' : 'Student Mentee');
        const otherRole = isStudent
          ? (viewingSession.mentorCompany ? `Mentor at ${viewingSession.mentorCompany}` : 'Expert Mentor')
          : (otherUser?.headline || 'Mentee Student');
        const otherAvatar =
          otherUser?.profileImage ||
          (isStudent
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

        const sessId = viewingSession._id || viewingSession.id;

        return (
          <div
            className="session-details-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingSession(null);
            }}
          >
            <div className="session-details-modal">
              <div className="session-details-header">
                <div>
                  <h3 className="session-details-title">{viewingSession.topic}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Session ID: {sessId}
                  </span>
                </div>
                <button
                  type="button"
                  className="session-details-close-btn"
                  onClick={() => setViewingSession(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="session-details-body">
                {/* Meta Grid */}
                <div className="session-details-meta-grid">
                  <div className="session-details-meta-item">
                    <div className="session-details-meta-icon">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="session-details-meta-label">Date & Time</div>
                      <div className="session-details-meta-val">{formattedDate} • {formattedTime}</div>
                    </div>
                  </div>

                  <div className="session-details-meta-item">
                    <div className="session-details-meta-icon">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="session-details-meta-label">Duration & Format</div>
                      <div className="session-details-meta-val">
                        {viewingSession.durationMinutes} Mins • {viewingSession.formatLabel || 'Video Mentorship'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participant Row */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    Participants
                  </div>
                  <div className="session-details-participants-row">
                    <div className="session-details-user-card">
                      <img src={otherAvatar} alt={otherName} className="session-details-user-avatar" />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {otherName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {otherRole}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                          {isStudent ? 'Mentor' : 'Mentee'}
                        </span>
                      </div>
                    </div>

                    <div className="session-details-user-card">
                      <img
                        src={user?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={user?.name}
                        className="session-details-user-avatar"
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {user?.name} (You)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {user?.role === 'student' ? 'Student' : 'Mentor'}
                        </div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                          Active Participant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agenda Box */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Agenda & Discussion Points
                  </div>
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {viewingSession.agenda || 'No specific agenda items provided. General 1:1 mentorship and questions.'}
                  </div>
                </div>

                {/* Room Code & Quick Join Banner */}
                <div className="session-room-box">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      WebRTC Video Room Code
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--primary)', marginTop: '2px' }}>
                      {viewingSession.roomCode}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Share this code or direct link with your participant.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleCopyRoomCode(viewingSession.roomCode, e)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      {copiedRoomCode === viewingSession.roomCode ? (
                        <>
                          <Check size={14} style={{ color: '#10b981' }} />
                          <span>Copied Code!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleCopyMeetingLink(viewingSession.roomCode, e)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      {copiedLink ? (
                        <>
                          <Check size={14} style={{ color: '#10b981' }} />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon size={14} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="session-details-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewingSession(null)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={sharingSessionId === sessId}
                  onClick={() => handleShareInChat(viewingSession)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
                >
                  <Share2 size={14} />
                  <span>Share in Chat</span>
                </button>

                {viewingSession.status === 'upcoming' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setViewingSession(null);
                      setActiveCallSession(viewingSession);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                  >
                    <Video size={16} />
                    <span>Join Video Call Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* REAL-TIME WEBRTC VIDEO CALL ROOM */}
      {activeCallSession && (
        <VideoCallRoom
          session={activeCallSession}
          user={user}
          onClose={handleEndCall}
        />
      )}
    </div>
  );
};

export default SessionsPage;

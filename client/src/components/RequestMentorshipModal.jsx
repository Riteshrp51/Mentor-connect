import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, AlertCircle, CheckCircle2, Briefcase, Sparkles, Clock, MessageSquare } from 'lucide-react';
import api from '../api/axios';

const MAX_MESSAGE_LENGTH = 800;

const RequestMentorshipModal = ({ mentor, isOpen, onClose, onSuccess, connectionStatus }) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !mentor) return null;

  const mentorUserId =
    typeof mentor.userId === 'object' && mentor.userId !== null
      ? mentor.userId._id || mentor.userId.id
      : mentor.userId || mentor._id || mentor.id;

  const mentorName = mentor.userId?.name || mentor.name || 'Mentor';
  const mentorCompany = mentor.company || mentor.userId?.company || mentor.title || 'Company';
  const mentorDomain = mentor.domain || mentor.title || 'General Mentorship';
  const mentorAvatar =
    mentor.userId?.profileImage ||
    mentor.profileImage ||
    mentor.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a mentorship topic or focus area.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await api.post('/api/requests', {
        mentorId: mentorUserId,
        topic: topic.trim(),
        message: message.trim(),
      });

      if (res.data && res.data.status === 'success') {
        setIsSubmitted(true);
        if (onSuccess) {
          onSuccess(res.data.data);
        }
      }
    } catch (err) {
      console.error('Mentorship request submission error:', err);
      const errMsg = err.response?.data?.message || 'Failed to send mentorship request. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTopic('');
    setMessage('');
    setError('');
    setIsSubmitted(false);
    onClose();
  };

  const handleNavigateToRequests = () => {
    handleClose();
    navigate('/student/requests');
  };

  const handleNavigateToMessages = () => {
    handleClose();
    navigate('/student/messages');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="dashboard-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--border-light)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Request Sent Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Your mentorship request for <strong>{topic}</strong> has been delivered to <strong>{mentorName}</strong>. You will receive an instant notification when they accept or respond.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNavigateToRequests}
              >
                View My Sent Requests
              </button>
            </div>
          </div>
        ) : connectionStatus === 'connected' ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Already Connected!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              You are already connected with <strong>{mentorName}</strong>. You can chat directly in real-time or schedule 1:1 sessions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNavigateToMessages}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={16} />
                Open Messages
              </button>
            </div>
          </div>
        ) : connectionStatus === 'pending' ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Clock size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Request Already Pending
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              You have already sent a pending mentorship request to <strong>{mentorName}</strong>. You will be notified once they respond.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNavigateToRequests}
              >
                View Sent Requests
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Request Mentorship</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Send an introduction and proposal to start your mentorship journey.
            </p>

            {/* Mentor Info Summary Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                marginBottom: '20px',
              }}
            >
              <img
                src={mentorAvatar}
                alt={mentorName}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{mentorName}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Briefcase size={12} />
                  <span>{mentorCompany}</span>
                  <span>•</span>
                  <span>{mentorDomain}</span>
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Mentorship Focus / Topic <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cloud Architecture & Resume Review"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Message & Background
                  </label>
                  <span
                    style={{
                      fontSize: '12px',
                      color: message.length > MAX_MESSAGE_LENGTH ? '#ef4444' : 'var(--text-muted)',
                      fontWeight: '600',
                    }}
                  >
                    {message.length} / {MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Tell the mentor what you're currently working on, your goals, and what specific guidance you are seeking..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !topic.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {loading ? (
                    'Sending Request...'
                  ) : (
                    <>
                      <Send size={15} />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestMentorshipModal;

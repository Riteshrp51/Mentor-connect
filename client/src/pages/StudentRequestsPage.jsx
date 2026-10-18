import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Ban,
  Calendar,
  Briefcase,
} from 'lucide-react';
import api from '../api/axios';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
];

const StudentRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchSentRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/requests/sent');
      if (res.data && res.data.status === 'success') {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch student requests:', err);
      setError('Unable to load your mentorship requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentRequests();
  }, []);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this pending mentorship request?')) {
      return;
    }

    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/api/requests/${requestId}/cancel`);
      if (res.data && res.data.status === 'success') {
        setRequests((prev) =>
          prev.map((r) => (r._id === requestId ? { ...r, status: 'cancelled', respondedAt: new Date() } : r))
        );
        setToastMessage('Mentorship request cancelled successfully.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to cancel request:', err);
      alert(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesFilter = activeFilter === 'all' || req.status === activeFilter;
    const mentorName = req.mentorId?.name || '';
    const topic = req.topic || '';
    const matchesSearch =
      mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Clock size={13} />
            Pending Review
          </span>
        );
      case 'accepted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={13} />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <XCircle size={13} />
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: 'rgba(100, 116, 139, 0.12)',
              color: '#64748b',
              border: '1px solid rgba(100, 116, 139, 0.25)',
            }}
          >
            <Ban size={13} />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getCountByStatus = (statusKey) => {
    if (statusKey === 'all') return requests.length;
    return requests.filter((r) => r.status === statusKey).length;
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            My Mentorship Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Track the status of your mentorship applications, start conversations, and manage requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchSentRequests}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/student/mentors')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={14} />
            Find Mentors
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
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div
        className="dashboard-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((tab) => {
            const count = getCountByStatus(tab.key);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border-light)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--border-light)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search topic or mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '34px',
              paddingRight: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p>Loading your mentorship requests...</p>
        </div>
      ) : error ? (
        <div className="dashboard-card" style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
          <AlertTriangle size={28} style={{ margin: '0 auto 8px auto' }} />
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={fetchSentRequests} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="dashboard-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.7 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            {requests.length === 0 ? 'No Mentorship Requests Yet' : 'No requests matching your filters'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
            {requests.length === 0
              ? 'Browse our network of vetted industry mentors and request tailored 1-on-1 guidance to accelerate your growth.'
              : 'Try clearing the search query or choosing another status tab.'}
          </p>
          {requests.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/student/mentors')}>
              Browse Mentors
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map((req) => {
            const mentor = req.mentorId;
            const createdFormatted = new Date(req.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={req._id}
                className="dashboard-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  border: '1px solid var(--border-light)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={
                        mentor?.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={mentor?.name || 'Mentor'}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>
                        {mentor?.name || 'Mentor'}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {mentor?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(req.status)}</div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Topic
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: req.message ? '8px' : '0' }}>
                    {req.topic}
                  </div>

                  {req.message && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '6px' }}>
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    <span>Submitted on {createdFormatted}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {req.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCancelRequest(req._id)}
                        disabled={actionLoadingId === req._id}
                        style={{
                          color: '#ef4444',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Ban size={13} />
                        {actionLoadingId === req._id ? 'Cancelling...' : 'Cancel Request'}
                      </button>
                    )}

                    {req.status === 'accepted' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/student/messages?requestId=${req._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={13} />
                        Open Conversation
                      </button>
                    )}

                    {req.status === 'rejected' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/student/mentors')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Find Another Mentor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentRequestsPage;
